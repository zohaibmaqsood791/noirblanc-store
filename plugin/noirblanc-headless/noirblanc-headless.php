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
});

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

    // ── Create order ──
    $order = wc_create_order([
        'status'      => 'processing',
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

    // ── Send customer email ──
    WC()->mailer()->emails['WC_Email_New_Order']->trigger($order->get_id());
    WC()->mailer()->emails['WC_Email_Customer_Processing_Order']->trigger($order->get_id());

    return new WP_REST_Response([
        'success'     => true,
        'orderId'     => $order->get_id(),
        'orderNumber' => $order->get_order_number(),
        'orderKey'    => $order->get_order_key(),
        'total'       => $order->get_total(),
    ], 200);
}
