<?php
/**
 * Plugin Name: Noir & Blanc Headless Checkout
 * Description: Secure REST endpoint for headless storefront order creation after Square payment.
 * Version: 1.0.0
 * Author: Noir & Blanc
 */

defined('ABSPATH') || exit;

// ── Secret key (change this to something random, then update NOIRBLANC_CHECKOUT_SECRET in Next.js .env) ──
define('NOIRBLANC_SECRET', 'nb_hdls_7x9kQmP2wRtZvL4nEsYcJ8uA');

add_action('rest_api_init', function () {
    register_rest_route('noirblanc/v1', '/checkout', [
        'methods'             => 'POST',
        'callback'            => 'noirblanc_create_order',
        'permission_callback' => 'noirblanc_verify_secret',
    ]);
    // Public endpoint — no auth needed, returns WooCommerce country+state data
    register_rest_route('noirblanc/v1', '/countries', [
        'methods'             => 'GET',
        'callback'            => 'noirblanc_get_countries',
        'permission_callback' => '__return_true',
    ]);
    // Public endpoint — product reviews with images
    register_rest_route('noirblanc/v1', '/reviews', [
        'methods'             => 'GET',
        'callback'            => 'noirblanc_get_reviews',
        'permission_callback' => '__return_true',
    ]);
});

function noirblanc_get_countries(): WP_REST_Response {
    $countries = WC()->countries->get_countries();
    $all_states = WC()->countries->get_states();
    $result = [];
    foreach ($countries as $code => $name) {
        $result[] = [
            'code'   => $code,
            'name'   => $name,
            'states' => isset($all_states[$code]) ? array_map(
                fn($sc, $sn) => ['code' => $sc, 'name' => $sn],
                array_keys($all_states[$code]),
                array_values($all_states[$code])
            ) : [],
        ];
    }
    return new WP_REST_Response($result, 200);
}

function noirblanc_get_reviews(WP_REST_Request $request): WP_REST_Response {
    $args = [
        'type'    => 'review',
        'status'  => 'approve',
        'number'  => 0,
        'orderby' => 'comment_date_gmt',
        'order'   => 'DESC',
    ];

    $comments = get_comments($args);

    $reviews = [];
    foreach ($comments as $c) {
        $rating = intval(get_comment_meta($c->comment_ID, 'rating', true));
        $title  = get_comment_meta($c->comment_ID, 'title', true);

        $images = [];

        // Prefer WP attachment IDs (images stored on our server)
        $attach_ids = get_comment_meta($c->comment_ID, 'review_images', true);
        if ($attach_ids) {
            foreach (explode(',', $attach_ids) as $aid) {
                $src = wp_get_attachment_url(intval($aid));
                if ($src) $images[] = $src;
            }
        }

        // Fallback: external URLs (review_image_urls)
        if (empty($images)) {
            $image_urls = get_comment_meta($c->comment_ID, 'review_image_urls', true);
            if ($image_urls) {
                foreach (explode(',', $image_urls) as $url) {
                    $url = trim($url);
                    if ($url) $images[] = $url;
                }
            }
        }

        $reviews[] = [
            'id'       => $c->comment_ID,
            'name'     => $c->comment_author,
            'rating'   => $rating ?: 5,
            'title'    => $title ?: '',
            'body'     => $c->comment_content,
            'date'     => $c->comment_date_gmt,
            'images'   => $images,
        ];
    }

    // Sort: reviews with images first, then by date desc
    usort($reviews, function($a, $b) {
        $a_has = !empty($a['images']) ? 1 : 0;
        $b_has = !empty($b['images']) ? 1 : 0;
        if ($a_has !== $b_has) return $b_has - $a_has;
        return strcmp($b['date'], $a['date']);
    });

    return new WP_REST_Response($reviews, 200);
}

function noirblanc_verify_secret(WP_REST_Request $request): bool {
    return $request->get_header('X-Noirblanc-Secret') === NOIRBLANC_SECRET;
}

function noirblanc_create_order(WP_REST_Request $request): WP_REST_Response {
    $data = $request->get_json_params();

    $billing  = $data['billing']  ?? [];
    $shipping = $data['shipping'] ?? $billing;
    $items    = $data['items']    ?? [];
    $transaction_id   = sanitize_text_field($data['transactionId']   ?? '');
    $payment_id       = sanitize_text_field($data['paymentId']       ?? $transaction_id);
    $shipping_method  = sanitize_text_field($data['shippingMethod']  ?? 'standard');
    $shipping_total   = floatval($data['shippingTotal']              ?? 0);
    $customer_email   = sanitize_email($billing['email']             ?? '');
    $coupons          = $data['coupons'] ?? [];
    $attribution      = $data['attribution'] ?? [];

    // ── Create order ──
    // Use 'pending' so WooCommerce does not fire the new-order email before
    // items and totals are populated. payment_complete() below transitions to
    // 'processing' and triggers the emails at the right time.
    $order = wc_create_order([
        'status'      => 'pending',
        'customer_id' => 0,
    ]);

    if (is_wp_error($order)) {
        return new WP_REST_Response(['error' => $order->get_error_message()], 500);
    }

    // ── Add line items ──
    foreach ($items as $item) {
        $product_id   = intval($item['productId']   ?? 0);
        $variation_id = intval($item['variationId'] ?? 0);
        $quantity     = intval($item['quantity']    ?? 1);

        if ($variation_id) {
            $product = wc_get_product($variation_id);
        } else {
            $product = wc_get_product($product_id);
        }

        if ($product) {
            $order->add_product($product, $quantity);
        }
    }

    // ── Addresses ──
    $order->set_address([
        'first_name' => sanitize_text_field($billing['firstName'] ?? ''),
        'last_name'  => sanitize_text_field($billing['lastName']  ?? ''),
        'address_1'  => sanitize_text_field($billing['address1']  ?? ''),
        'address_2'  => sanitize_text_field($billing['address2']  ?? ''),
        'city'       => sanitize_text_field($billing['city']      ?? ''),
        'state'      => sanitize_text_field($billing['state']     ?? ''),
        'postcode'   => sanitize_text_field($billing['postcode']  ?? ''),
        'country'    => sanitize_text_field($billing['country']   ?? 'US'),
        'email'      => $customer_email,
        'phone'      => sanitize_text_field($billing['phone']     ?? ''),
    ], 'billing');

    $order->set_address([
        'first_name' => sanitize_text_field($shipping['firstName'] ?? $billing['firstName'] ?? ''),
        'last_name'  => sanitize_text_field($shipping['lastName']  ?? $billing['lastName']  ?? ''),
        'address_1'  => sanitize_text_field($shipping['address1']  ?? $billing['address1']  ?? ''),
        'address_2'  => sanitize_text_field($shipping['address2']  ?? $billing['address2']  ?? ''),
        'city'       => sanitize_text_field($shipping['city']      ?? $billing['city']      ?? ''),
        'state'      => sanitize_text_field($shipping['state']     ?? $billing['state']     ?? ''),
        'postcode'   => sanitize_text_field($shipping['postcode']  ?? $billing['postcode']  ?? ''),
        'country'    => sanitize_text_field($shipping['country']   ?? $billing['country']   ?? 'US'),
    ], 'shipping');

    // ── Apply coupons ──
    if (!empty($coupons) && is_array($coupons)) {
        foreach ($coupons as $coupon_code) {
            $coupon_code = sanitize_text_field($coupon_code);
            if ($coupon_code) {
                $order->apply_coupon($coupon_code);
            }
        }
    }

    // ── Shipping line ──
    if ($shipping_total > 0) {
        $shipping_item = new WC_Order_Item_Shipping();
        $shipping_item->set_method_title(ucfirst($shipping_method) . ' Shipping');
        $shipping_item->set_method_id('flat_rate');
        $shipping_item->set_total($shipping_total);
        $order->add_item($shipping_item);
    }

    // ── Payment ──
    $order->set_payment_method('square_credit_card');
    $order->set_payment_method_title('Credit Card (Square)');
    $order->set_transaction_id($payment_id);

    // ── Calculate + mark paid ──
    $order->calculate_totals();
    $order->payment_complete($payment_id);
    $order->add_order_note(sprintf(
        'Payment of %s completed via Square. Transaction ID: %s',
        wc_price($order->get_total()),
        $payment_id
    ));

    // ── Save attribution ──
    if (!empty($attribution)) {
        $source   = sanitize_text_field($attribution['source']   ?? '');
        $medium   = sanitize_text_field($attribution['medium']   ?? '');
        $campaign = sanitize_text_field($attribution['campaign'] ?? '');
        $content  = sanitize_text_field($attribution['content']  ?? '');
        $referrer = esc_url_raw($attribution['referrer']         ?? '');

        if ($source)   $order->update_meta_data('_nb_utm_source',   $source);
        if ($medium)   $order->update_meta_data('_nb_utm_medium',   $medium);
        if ($campaign) $order->update_meta_data('_nb_utm_campaign', $campaign);
        if ($content)  $order->update_meta_data('_nb_utm_content',  $content);
        if ($referrer) $order->update_meta_data('_nb_referrer',     $referrer);
        $order->save();

        if ($source || $medium || $campaign) {
            $order->add_order_note(sprintf(
                'Traffic source: %s / %s — Campaign: %s',
                $source ?: 'direct',
                $medium ?: 'none',
                $campaign ?: 'none'
            ));
        }
    }

    return new WP_REST_Response([
        'success'     => true,
        'orderId'     => $order->get_id(),
        'orderNumber' => $order->get_order_number(),
        'orderKey'    => $order->get_order_key(),
        'total'       => $order->get_total(),
    ], 200);
}

// ── Orders list: add Source column ────────────────────────────────────────────
add_filter('manage_woocommerce_page_wc-orders_columns', 'nb_add_source_column');
add_filter('manage_edit-shop_order_columns',            'nb_add_source_column');
function nb_add_source_column(array $columns): array {
    $new = [];
    foreach ($columns as $key => $label) {
        $new[$key] = $label;
        if ($key === 'order_total') {
            $new['nb_source'] = 'Source';
        }
    }
    return $new;
}

add_action('manage_woocommerce_page_wc-orders_custom_column', 'nb_render_source_column', 10, 2);
add_action('manage_shop_order_posts_custom_column',           'nb_render_source_column', 10, 2);
function nb_render_source_column(string $column, $order_or_id): void {
    if ($column !== 'nb_source') return;

    $order    = is_object($order_or_id) ? $order_or_id : wc_get_order($order_or_id);
    if (!$order) return;
    $source   = $order->get_meta('_nb_utm_source');
    $medium   = $order->get_meta('_nb_utm_medium');
    $campaign = $order->get_meta('_nb_utm_campaign');

    if (!$source) { echo '<span style="color:#aaa">—</span>'; return; }

    $colors = [
        'facebook'  => '#1877F2',
        'instagram' => '#E1306C',
        'google'    => '#4285F4',
        'klaviyo'   => '#00B67A',
        'direct'    => '#6B7280',
    ];
    $color = $colors[strtolower($source)] ?? '#374151';

    echo '<span style="font-size:11px;line-height:1.4;display:block">';
    echo '<strong style="color:' . esc_attr($color) . '">' . esc_html(ucfirst($source)) . '</strong>';
    if ($medium)   echo '<br><span style="color:#6B7280">' . esc_html($medium) . '</span>';
    if ($campaign) echo '<br><span style="color:#374151;font-size:10px">' . esc_html(wp_trim_words($campaign, 4, '…')) . '</span>';
    echo '</span>';
}
