<?php
/**
 * Shopify → WooCommerce Direct DB Importer
 * DELETE this file and all CSVs when done.
 *
 * NOTE: Requires WooCommerce traditional post-based order storage (not HPOS).
 * If orders don't appear after import, check WooCommerce > Settings > Advanced > Features
 * and disable "High-Performance Order Storage", then re-import.
 */

define('IMPORT_SECRET', 'nb_shopify_2026');
define('ORDERS_CSV',    __DIR__ . '/shopify-orders.csv');
define('CUSTOMERS_CSV', __DIR__ . '/shopify-customers.csv');
define('COUPONS_CSV',   __DIR__ . '/shopify-coupons.csv');
define('BATCH',         2000);

if (($_GET['secret'] ?? '') !== IMPORT_SECRET) { http_response_code(403); die('Forbidden'); }

require_once __DIR__ . '/wp-load.php';

global $wpdb;
set_time_limit(300);
ini_set('memory_limit', '512M');
$wpdb->show_errors();

$mode   = $_GET['mode']   ?? '';
$offset = intval($_GET['offset'] ?? 0);
$auto   = ($_GET['auto']  ?? '1') !== '0';

// ════════════════════════════════════════════════════════════════════════════
// COUPONS
// ════════════════════════════════════════════════════════════════════════════
if ($mode === 'coupons') {
    if (!file_exists(COUPONS_CSV)) die('shopify-coupons.csv not found');
    header('Content-Type: text/plain; charset=utf-8');

    $existing = $wpdb->get_col("SELECT post_title FROM {$wpdb->posts} WHERE post_type='shop_coupon' AND post_status='publish'");
    $existing = array_flip(array_map('strtolower', $existing));

    $fh = fopen(COUPONS_CSV, 'r');
    $headers = fgetcsv($fh);
    $imported = 0; $skipped = 0;
    $now = current_time('mysql');

    while (($row = fgetcsv($fh)) !== false) {
        $r = array_combine($headers, $row);
        if (($r['Status'] ?? '') !== 'Active') { $skipped++; continue; }

        $code = strtolower(trim($r['Name']));
        if (!$code || isset($existing[$code])) { $skipped++; continue; }

        $value = abs(floatval($r['Value']));
        $type  = ($r['Value Type'] === 'percentage') ? 'percent' : 'fixed_cart';
        $limit = intval($r['Usage Limit Per Code'] ?? 0);
        $once  = ($r['Applies Once Per Customer'] ?? '') === 'true';

        $wpdb->insert($wpdb->posts, [
            'post_title'     => $code,
            'post_name'      => $code,
            'post_status'    => 'publish',
            'post_type'      => 'shop_coupon',
            'post_excerpt'   => 'Imported from Shopify',
            'post_date'      => $now,
            'post_date_gmt'  => get_gmt_from_date($now),
            'post_modified'  => $now,
            'post_modified_gmt' => get_gmt_from_date($now),
            'post_author'    => 1,
            'comment_status' => 'closed',
        ]);
        $id = $wpdb->insert_id;
        if (!$id) { $skipped++; continue; }

        $metas = [
            ['post_id'=>$id,'meta_key'=>'discount_type','meta_value'=>$type],
            ['post_id'=>$id,'meta_key'=>'coupon_amount','meta_value'=>$value],
            ['post_id'=>$id,'meta_key'=>'individual_use','meta_value'=>'no'],
            ['post_id'=>$id,'meta_key'=>'free_shipping','meta_value'=>'no'],
        ];
        if ($limit) $metas[] = ['post_id'=>$id,'meta_key'=>'usage_limit','meta_value'=>$limit];
        if ($once)  $metas[] = ['post_id'=>$id,'meta_key'=>'usage_limit_per_user','meta_value'=>1];

        $vals = array_map(fn($m) => $wpdb->prepare("(%d,%s,%s)", $m['post_id'], $m['meta_key'], $m['meta_value']), $metas);
        $wpdb->query("INSERT INTO {$wpdb->postmeta} (post_id,meta_key,meta_value) VALUES " . implode(',', $vals));

        $existing[$code] = true;
        echo "OK {$code} {$value}" . ($type==='percent'?'%':'$') . "\n";
        $imported++;
    }
    fclose($fh);
    echo "\nDone. Imported: {$imported} | Skipped: {$skipped}\n";
    exit;
}

// ════════════════════════════════════════════════════════════════════════════
// CUSTOMERS — direct DB insert
// ════════════════════════════════════════════════════════════════════════════
if ($mode === 'customers') {
    if (!file_exists(CUSTOMERS_CSV)) die('shopify-customers.csv not found');
    header('Content-Type: text/html; charset=utf-8');

    $existing_emails = $wpdb->get_col("SELECT user_email FROM {$wpdb->users}");
    $existing_emails = array_flip(array_map('strtolower', $existing_emails));

    $fh = fopen(CUSTOMERS_CSV, 'r');
    $headers = fgetcsv($fh);

    for ($i = 0; $i < $offset; $i++) fgetcsv($fh);

    $imported = 0; $skipped = 0; $count = 0;
    $now = current_time('mysql');
    $now_gmt = get_gmt_from_date($now);

    // Collect user rows + meta for bulk insert
    $user_rows  = [];
    $user_data  = []; // email -> [first, last, phone, address fields...]

    while (($row = fgetcsv($fh)) !== false && $count < BATCH) {
        $r = array_combine($headers, $row);
        $count++;

        $email = strtolower(sanitize_email($r['Email'] ?? ''));
        if (!$email || isset($existing_emails[$email])) { $skipped++; continue; }

        $first = sanitize_text_field($r['First Name'] ?? '');
        $last  = sanitize_text_field($r['Last Name']  ?? '');
        $pass  = wp_hash_password(wp_generate_password(16));

        $user_rows[] = $wpdb->prepare(
            "(%s,%s,%s,%s,%s,0)",
            $email, $pass, $email,
            $now, trim("{$first} {$last}") ?: $email
        );

        $user_data[$email] = [
            'first' => $first, 'last' => $last,
            'phone' => sanitize_text_field($r['Phone'] ?? $r['Default Address Phone'] ?? ''),
            'addr1' => sanitize_text_field($r['Default Address Address1'] ?? ''),
            'addr2' => sanitize_text_field($r['Default Address Address2'] ?? ''),
            'city'  => sanitize_text_field($r['Default Address City'] ?? ''),
            'state' => sanitize_text_field($r['Default Address Province Code'] ?? ''),
            'zip'   => sanitize_text_field($r['Default Address Zip'] ?? ''),
            'country' => sanitize_text_field($r['Default Address Country Code'] ?? ''),
            'shopify_id' => sanitize_text_field($r['Customer ID'] ?? ''),
        ];

        $existing_emails[$email] = true;
    }
    fclose($fh);

    if ($user_rows) {
        // Bulk insert all users in one query
        $wpdb->query(
            "INSERT IGNORE INTO {$wpdb->users} (user_login,user_pass,user_email,user_registered,display_name,user_status) VALUES "
            . implode(',', $user_rows)
        );

        // Fetch inserted IDs
        $emails_in = "'" . implode("','", array_map('esc_sql', array_keys($user_data))) . "'";
        $rows = $wpdb->get_results(
            "SELECT ID, user_email FROM {$wpdb->users} WHERE user_email IN ({$emails_in})",
            ASSOC
        );

        $meta_vals = [];
        foreach ($rows as $u) {
            $uid = (int)$u['ID'];
            $d   = $user_data[strtolower($u['user_email'])] ?? null;
            if (!$d) continue;
            $imported++;
            foreach ([
                'first_name'           => $d['first'],
                'last_name'            => $d['last'],
                'nickname'             => $d['first'] ?: $u['user_email'],
                $wpdb->prefix . 'capabilities' => serialize(['customer' => true]),
                $wpdb->prefix . 'user_level'   => '0',
                'billing_first_name'   => $d['first'],
                'billing_last_name'    => $d['last'],
                'billing_email'        => $u['user_email'],
                'billing_phone'        => $d['phone'],
                'billing_address_1'    => $d['addr1'],
                'billing_address_2'    => $d['addr2'],
                'billing_city'         => $d['city'],
                'billing_state'        => $d['state'],
                'billing_postcode'     => $d['zip'],
                'billing_country'      => $d['country'],
                'shipping_first_name'  => $d['first'],
                'shipping_last_name'   => $d['last'],
                'shipping_address_1'   => $d['addr1'],
                'shipping_city'        => $d['city'],
                'shipping_state'       => $d['state'],
                'shipping_postcode'    => $d['zip'],
                'shipping_country'     => $d['country'],
                'shopify_customer_id'  => $d['shopify_id'],
            ] as $key => $val) {
                $meta_vals[] = $wpdb->prepare("(%d,%s,%s)", $uid, $key, $val);
            }
        }

        if ($meta_vals) {
            // Chunk to avoid hitting max_allowed_packet
            foreach (array_chunk($meta_vals, 500) as $chunk) {
                $wpdb->query(
                    "INSERT IGNORE INTO {$wpdb->usermeta} (user_id,meta_key,meta_value) VALUES "
                    . implode(',', $chunk)
                );
            }
        }
    }

    $next = $offset + BATCH;
    $total = 27801;
    $pct   = min(round(($next / $total) * 100), 100);
    $next_url = "?secret=nb_shopify_2026&mode=customers&offset={$next}&auto=1";

    echo "<pre>Batch {$offset}–" . ($offset + $count) . " / {$total} ({$pct}%): Imported {$imported} | Skipped {$skipped}\n";
    if ($auto && $next < $total) {
        echo "Auto-advancing to {$next}...</pre>";
        echo "<script>setTimeout(()=>location.href='{$next_url}',300)</script>";
    } else {
        echo ($next >= $total ? "✅ ALL CUSTOMERS DONE" : "Next: {$next_url}") . "</pre>";
    }
    exit;
}

// ════════════════════════════════════════════════════════════════════════════
// ORDERS — direct DB insert (no WC API)
// ════════════════════════════════════════════════════════════════════════════
if ($mode === 'orders') {
    if (!file_exists(ORDERS_CSV)) die('shopify-orders.csv not found');
    header('Content-Type: text/html; charset=utf-8');

    // Parse entire CSV into order groups
    $fh      = fopen(ORDERS_CSV, 'r');
    $headers = fgetcsv($fh);
    $orders  = [];
    $last    = null;

    while (($row = fgetcsv($fh)) !== false) {
        $r    = array_combine($headers, $row);
        $name = trim($r['Name'] ?? '');
        if ($name) {
            $last = $name;
            $orders[$name] = ['meta' => $r, 'items' => []];
        }
        if ($last && !empty($r['Lineitem name'])) {
            $orders[$last]['items'][] = [
                'name'  => sanitize_text_field($r['Lineitem name']),
                'qty'   => max(1, intval($r['Lineitem quantity'] ?? 1)),
                'price' => floatval($r['Lineitem price'] ?? 0),
                'sku'   => sanitize_text_field($r['Lineitem sku'] ?? ''),
            ];
        }
    }
    fclose($fh);

    $all_keys = array_keys($orders);
    $total    = count($all_keys);
    $batch    = array_slice($all_keys, $offset, BATCH);

    // Pre-load already-imported order names
    $done = $wpdb->get_col("SELECT meta_value FROM {$wpdb->postmeta} WHERE meta_key='_shopify_order_name'");
    $done = array_flip($done);

    // Pre-load user ID map by email
    $user_map = [];
    $rows = $wpdb->get_results("SELECT user_email, ID FROM {$wpdb->users}", ARRAY_A);
    foreach ($rows as $r) $user_map[strtolower($r['user_email'])] = (int)$r['ID'];

    $order_items_table     = $wpdb->prefix . 'woocommerce_order_items';
    $order_itemmeta_table  = $wpdb->prefix . 'woocommerce_order_itemmeta';

    $imported = 0; $skipped = 0;
    $now = current_time('mysql');

    foreach ($batch as $order_name) {
        if (isset($done[$order_name])) { $skipped++; continue; }

        $o    = $orders[$order_name];
        $m    = $o['meta'];

        $fin = strtolower($m['Financial Status'] ?? '');
        if (!in_array($fin, ['paid', 'partially_refunded'])) { $skipped++; continue; }

        $email    = sanitize_email($m['Email'] ?? '');
        $uid      = $user_map[strtolower($email)] ?? 0;
        $ful      = strtolower($m['Fulfillment Status'] ?? '');
        $wc_status = ($ful === 'fulfilled') ? 'wc-completed' : 'wc-processing';

        $created_at = sanitize_text_field($m['Created at'] ?? $now);
        $created_mysql = date('Y-m-d H:i:s', strtotime($created_at) ?: time());
        $created_gmt   = get_gmt_from_date($created_mysql);

        $total_amt = floatval($m['Total'] ?? 0);
        $ship_amt  = floatval($m['Shipping'] ?? 0);

        $bn = explode(' ', trim($m['Billing Name'] ?? ''), 2);
        $sn = explode(' ', trim($m['Shipping Name'] ?? ''), 2);

        $order_key = 'wc_' . uniqid('', true);

        // ── Insert post ──────────────────────────────────────────────────
        $wpdb->insert($wpdb->posts, [
            'post_author'       => $uid ?: 1,
            'post_date'         => $created_mysql,
            'post_date_gmt'     => $created_gmt,
            'post_modified'     => $created_mysql,
            'post_modified_gmt' => $created_gmt,
            'post_status'       => $wc_status,
            'post_type'         => 'shop_order',
            'post_title'        => 'Order',
            'ping_status'       => 'closed',
            'comment_status'    => 'closed',
            'post_name'         => '',
            'post_content'      => '',
            'post_excerpt'      => '',
            'guid'              => '',
        ]);
        $oid = $wpdb->insert_id;
        if (!$oid) { $skipped++; continue; }

        // ── Bulk insert post meta ────────────────────────────────────────
        $meta = [
            '_order_key'              => $order_key,
            '_order_currency'         => sanitize_text_field($m['Currency'] ?? 'USD'),
            '_order_total'            => number_format($total_amt, 2, '.', ''),
            '_order_shipping'         => number_format($ship_amt, 2, '.', ''),
            '_order_tax'              => number_format(floatval($m['Taxes'] ?? 0), 2, '.', ''),
            '_order_discount'         => number_format(floatval($m['Discount Amount'] ?? 0), 2, '.', ''),
            '_prices_include_tax'     => 'no',
            '_payment_method'         => 'shopify',
            '_payment_method_title'   => sanitize_text_field($m['Payment Method'] ?? 'Shopify'),
            '_transaction_id'         => sanitize_text_field($m['Payment Reference'] ?? ''),
            '_customer_ip_address'    => '',
            '_customer_user_agent'    => '',
            '_customer_user'          => $uid,
            '_created_via'            => 'shopify_import',
            '_billing_first_name'     => sanitize_text_field($bn[0] ?? ''),
            '_billing_last_name'      => sanitize_text_field($bn[1] ?? ''),
            '_billing_email'          => $email,
            '_billing_phone'          => sanitize_text_field($m['Billing Phone'] ?? ''),
            '_billing_address_1'      => sanitize_text_field($m['Billing Address1'] ?? ''),
            '_billing_address_2'      => sanitize_text_field($m['Billing Address2'] ?? ''),
            '_billing_city'           => sanitize_text_field($m['Billing City'] ?? ''),
            '_billing_state'          => sanitize_text_field($m['Billing Province'] ?? ''),
            '_billing_postcode'       => sanitize_text_field($m['Billing Zip'] ?? ''),
            '_billing_country'        => sanitize_text_field($m['Billing Country'] ?? ''),
            '_shipping_first_name'    => sanitize_text_field($sn[0] ?? ''),
            '_shipping_last_name'     => sanitize_text_field($sn[1] ?? ''),
            '_shipping_address_1'     => sanitize_text_field($m['Shipping Address1'] ?? ''),
            '_shipping_address_2'     => sanitize_text_field($m['Shipping Address2'] ?? ''),
            '_shipping_city'          => sanitize_text_field($m['Shipping City'] ?? ''),
            '_shipping_state'         => sanitize_text_field($m['Shipping Province'] ?? ''),
            '_shipping_postcode'      => sanitize_text_field($m['Shipping Zip'] ?? ''),
            '_shipping_country'       => sanitize_text_field($m['Shipping Country'] ?? ''),
            '_shopify_order_name'     => $order_name,
            '_shopify_order_id'       => sanitize_text_field($m['Id'] ?? ''),
        ];

        $meta_vals = [];
        foreach ($meta as $key => $val) {
            $meta_vals[] = $wpdb->prepare("(%d,%s,%s)", $oid, $key, $val);
        }
        $wpdb->query(
            "INSERT INTO {$wpdb->postmeta} (post_id,meta_key,meta_value) VALUES "
            . implode(',', $meta_vals)
        );

        // ── Line items ───────────────────────────────────────────────────
        foreach ($o['items'] as $item) {
            $line_total = round($item['price'] * $item['qty'], 2);

            $wpdb->insert($order_items_table, [
                'order_item_name' => $item['name'],
                'order_item_type' => 'line_item',
                'order_id'        => $oid,
            ]);
            $item_id = $wpdb->insert_id;

            $item_meta = [
                '_qty'            => $item['qty'],
                '_line_total'     => $line_total,
                '_line_subtotal'  => $line_total,
                '_line_tax'       => 0,
                '_line_subtotal_tax' => 0,
                '_tax_class'      => '',
                '_tax_status'     => 'taxable',
            ];
            if ($item['sku']) $item_meta['_sku'] = $item['sku'];

            $im_vals = [];
            foreach ($item_meta as $k => $v) {
                $im_vals[] = $wpdb->prepare("(%d,%s,%s)", $item_id, $k, $v);
            }
            $wpdb->query(
                "INSERT INTO {$order_itemmeta_table} (order_item_id,meta_key,meta_value) VALUES "
                . implode(',', $im_vals)
            );
        }

        // ── Shipping item ────────────────────────────────────────────────
        if ($ship_amt > 0) {
            $wpdb->insert($order_items_table, [
                'order_item_name' => sanitize_text_field($m['Shipping Method'] ?? 'Standard Shipping'),
                'order_item_type' => 'shipping',
                'order_id'        => $oid,
            ]);
            $ship_item_id = $wpdb->insert_id;
            $wpdb->query($wpdb->prepare(
                "INSERT INTO {$order_itemmeta_table} (order_item_id,meta_key,meta_value) VALUES (%d,'cost',%s)",
                $ship_item_id, $ship_amt
            ));
        }

        $done[$order_name] = true;
        $imported++;
    }

    $next     = $offset + BATCH;
    $pct      = min(round(($next / $total) * 100), 100);
    $next_url = "?secret=nb_shopify_2026&mode=orders&offset={$next}&auto=1";

    echo "<pre>Batch {$offset}–" . ($offset + count($batch)) . " / {$total} ({$pct}%): Imported {$imported} | Skipped {$skipped}\n";
    if ($auto && $next < $total) {
        echo "Auto-advancing to {$next}...</pre>";
        echo "<script>setTimeout(()=>location.href='{$next_url}',300)</script>";
    } else {
        echo ($next >= $total ? "✅ ALL ORDERS DONE" : "Next: {$next_url}") . "</pre>";
    }
    exit;
}

// ════════════════════════════════════════════════════════════════════════════
// FIX CUSTOMERS — populate wc_customer_lookup + fix capabilities prefix
// Run this after customers import to make them appear in WooCommerce > Customers
// ════════════════════════════════════════════════════════════════════════════
if ($mode === 'fix_customers') {
    header('Content-Type: text/html; charset=utf-8');

    $cap_key  = $wpdb->prefix . 'capabilities';   // e.g. wp_capabilities
    $lvl_key  = $wpdb->prefix . 'user_level';
    $lookup   = $wpdb->prefix . 'wc_customer_lookup';

    // Step 1: Fix any users whose capabilities were saved with wrong prefix
    // (if we hardcoded 'wp_capabilities' but the prefix is different)
    if ($cap_key !== 'wp_capabilities') {
        $wpdb->query($wpdb->prepare(
            "UPDATE {$wpdb->usermeta} SET meta_key = %s WHERE meta_key = 'wp_capabilities'",
            $cap_key
        ));
        $wpdb->query($wpdb->prepare(
            "UPDATE {$wpdb->usermeta} SET meta_key = %s WHERE meta_key = 'wp_user_level'",
            $lvl_key
        ));
        echo "<p>Fixed capabilities prefix → {$cap_key}</p>";
    }

    // Step 2: Get all users with customer role not yet in lookup table
    $already = $wpdb->get_col("SELECT user_id FROM {$lookup}");
    $already = $already ? array_flip($already) : [];

    $batch_size = intval($_GET['batch'] ?? 2000);
    $pg_offset  = intval($_GET['offset'] ?? 0);

    $users = $wpdb->get_results($wpdb->prepare(
        "SELECT u.ID, u.user_email, u.user_registered, u.display_name,
                MAX(CASE WHEN um.meta_key='first_name' THEN um.meta_value END) as first_name,
                MAX(CASE WHEN um.meta_key='last_name'  THEN um.meta_value END) as last_name,
                MAX(CASE WHEN um.meta_key='billing_country'  THEN um.meta_value END) as country,
                MAX(CASE WHEN um.meta_key='billing_postcode' THEN um.meta_value END) as postcode,
                MAX(CASE WHEN um.meta_key='billing_city'     THEN um.meta_value END) as city,
                MAX(CASE WHEN um.meta_key='billing_state'    THEN um.meta_value END) as state
         FROM {$wpdb->users} u
         LEFT JOIN {$wpdb->usermeta} um ON um.user_id = u.ID
           AND um.meta_key IN ('first_name','last_name','billing_country','billing_postcode','billing_city','billing_state')
         INNER JOIN {$wpdb->usermeta} cap ON cap.user_id = u.ID
           AND cap.meta_key = %s
           AND cap.meta_value LIKE %s
         GROUP BY u.ID
         LIMIT %d OFFSET %d",
        $cap_key,
        '%customer%',
        $batch_size,
        $pg_offset
    ), ARRAY_A);

    $inserted = 0; $skipped = 0;
    $rows = [];

    foreach ($users as $u) {
        if (isset($already[(int)$u['ID']])) { $skipped++; continue; }

        $registered = date('Y-m-d H:i:s', strtotime($u['user_registered'] ?: 'now'));
        $rows[] = $wpdb->prepare(
            "(%d, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            $u['ID'],
            $u['user_email'],
            $u['first_name'] ?: '',
            $u['last_name']  ?: '',
            $u['user_email'],
            $registered,    // date_last_active
            $registered,    // date_registered
            $u['country']  ?: '',
            $u['postcode'] ?: '',
            $u['city']     ?: ''
        );
        $inserted++;
    }

    if ($rows) {
        foreach (array_chunk($rows, 500) as $chunk) {
            $wpdb->query(
                "INSERT IGNORE INTO {$lookup}
                 (user_id, username, first_name, last_name, email, date_last_active, date_registered, country, postcode, city)
                 VALUES " . implode(',', $chunk)
            );
        }
    }

    $next = $pg_offset + $batch_size;
    $auto_next = "?secret=nb_shopify_2026&mode=fix_customers&offset={$next}&auto=1";

    echo "<pre>Batch {$pg_offset}: Added to lookup: {$inserted} | Already there: {$skipped}\n";
    if (count($users) === $batch_size) {
        echo "More users may remain — auto-advancing...</pre>";
        echo "<script>setTimeout(()=>location.href='{$auto_next}',300)</script>";
    } else {
        echo "✅ ALL DONE — customers should now appear in WooCommerce > Customers</pre>";
    }
    exit;
}

// ════════════════════════════════════════════════════════════════════════════
// STATUS CHECK
// ════════════════════════════════════════════════════════════════════════════
if ($mode === 'status') {
    header('Content-Type: text/plain; charset=utf-8');
    $lookup   = $wpdb->prefix . 'wc_customer_lookup';
    $customers_wp  = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->users}");
    $customers_wc  = $wpdb->get_var("SELECT COUNT(*) FROM {$lookup}");
    $orders        = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type='shop_order'");
    $coupons       = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type='shop_coupon' AND post_status='publish'");
    echo "WP Users (total)      : {$customers_wp}\n";
    echo "WC Customer lookup    : {$customers_wc}\n";
    echo "Orders                : {$orders}\n";
    echo "Coupons               : {$coupons}\n";
    exit;
}

echo "Usage: ?secret=nb_shopify_2026&mode=coupons|customers|orders|fix_customers|status\n";
