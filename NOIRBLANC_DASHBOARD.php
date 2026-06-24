<?php
/**
 * Plugin Name: Noir & Blanc Sales Dashboard
 * Description: Daily sales analytics dashboard for WooCommerce
 * Version: 1.0
 */

if (!defined('ABSPATH')) exit;

/* ── Meta CAPI — server-side Purchase event (fires on every completed order) ── */
// Fire when payment is confirmed (order → Processing). Both hooks cover
// different gateway paths; deduplication via _nb_capi_sent prevents double-fire.
add_action('woocommerce_payment_complete',        'nb_capi_purchase', 10, 1);
add_action('woocommerce_order_status_processing', 'nb_capi_purchase', 10, 1);

function nb_capi_purchase(int $order_id): void {
    // Deduplicate: only fire once per order
    if (get_post_meta($order_id, '_nb_capi_sent', true)) return;
    update_post_meta($order_id, '_nb_capi_sent', '1');

    $token = defined('NB_META_CAPI_TOKEN') ? NB_META_CAPI_TOKEN : get_option('nb_meta_capi_token', '');
    $pixel = defined('NB_META_PIXEL_ID')   ? NB_META_PIXEL_ID   : get_option('nb_meta_pixel_id', '724894499822999');
    if (!$token) return;

    $order = wc_get_order($order_id);
    if (!$order) return;

    // Build hashed user data
    function nb_sha256(string $v): string { return hash('sha256', strtolower(trim($v))); }

    $user_data = array_filter([
        'em' => $order->get_billing_email() ? nb_sha256($order->get_billing_email()) : null,
        'fn' => $order->get_billing_first_name() ? nb_sha256($order->get_billing_first_name()) : null,
        'ln' => $order->get_billing_last_name() ? nb_sha256($order->get_billing_last_name()) : null,
        'ph' => $order->get_billing_phone() ? nb_sha256(preg_replace('/\D/', '', $order->get_billing_phone())) : null,
        'ct' => $order->get_billing_city() ? nb_sha256($order->get_billing_city()) : null,
        'st' => $order->get_billing_state() ? nb_sha256(strtolower($order->get_billing_state())) : null,
        'zp' => $order->get_billing_postcode() ? nb_sha256($order->get_billing_postcode()) : null,
        'country' => $order->get_billing_country() ? nb_sha256(strtolower($order->get_billing_country())) : null,
    ]);

    $content_ids = [];
    $num_items   = 0;
    foreach ($order->get_items() as $item) {
        $product = $item->get_variation_id()
            ? wc_get_product($item->get_variation_id())
            : wc_get_product($item->get_product_id());
        $sku = $product ? $product->get_sku() : '';
        $content_ids[] = $sku ?: (string) $item->get_product_id();
        $num_items     += $item->get_quantity();
    }

    $test_code = defined('NB_META_TEST_EVENT_CODE') ? NB_META_TEST_EVENT_CODE : '';

    $payload = [
        'data' => [[
            'event_name'       => 'Purchase',
            'event_time'       => time(),
            'event_id'         => 'wp-' . $order_id,
            'event_source_url' => 'https://www.noirblancnyc.com/checkout/success',
            'action_source'    => 'website',
            'user_data'        => $user_data,
            'custom_data'      => [
                'value'        => (float) $order->get_total(),
                'currency'     => 'USD',
                'content_type' => 'product',
                'content_ids'  => $content_ids,
                'num_items'    => $num_items,
                'order_id'     => (string) $order_id,
            ],
        ]],
    ];

    if ($test_code) $payload['test_event_code'] = $test_code;

    wp_remote_post(
        "https://graph.facebook.com/v19.0/{$pixel}/events?access_token={$token}",
        [
            'headers' => ['Content-Type' => 'application/json'],
            'body'    => wp_json_encode($payload),
            'timeout' => 10,
        ]
    );
}

/* ── Admin menu ──────────────────────────────────────────────────────────── */
add_action('admin_menu', function () {
    add_menu_page(
        'Sales Dashboard',
        'Sales Dashboard',
        'manage_woocommerce',
        'nb-dashboard',
        'nb_dashboard_page',
        'dashicons-chart-line',
        3
    );
    add_submenu_page(
        'nb-dashboard',
        'Event Logs',
        'Event Logs',
        'manage_woocommerce',
        'nb-event-logs',
        'nb_event_logs_page'
    );
});

/* ── Debug log storage ───────────────────────────────────────────────────── */
function nb_get_logs_table(): string {
    global $wpdb;
    return $wpdb->prefix . 'nb_event_logs';
}

function nb_create_logs_table(): void {
    global $wpdb;
    $table   = nb_get_logs_table();
    $charset = $wpdb->get_charset_collate();
    $sql     = "CREATE TABLE IF NOT EXISTS {$table} (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        event varchar(100) NOT NULL,
        email varchar(255) DEFAULT '',
        data longtext DEFAULT '',
        url varchar(500) DEFAULT '',
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) {$charset};";
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);
}
register_activation_hook(__FILE__, 'nb_create_logs_table');
add_action('init', function () {
    global $wpdb;
    if (!$wpdb->get_var("SHOW TABLES LIKE '" . nb_get_logs_table() . "'")) {
        nb_create_logs_table();
    }
});

/* ── REST: receive debug logs from Next.js ───────────────────────────────── */
add_action('rest_api_init', function () {
    // This mirrors the existing /custom/v1/debug-logs endpoint but also writes to DB
    register_rest_route('nb/v1', '/log', [
        'methods'             => 'POST',
        'callback'            => function (WP_REST_Request $req) {
            global $wpdb;
            $event = sanitize_text_field($req->get_param('event') ?? '');
            $email = sanitize_email($req->get_param('email') ?? '');
            $url   = esc_url_raw($req->get_param('url') ?? '');
            $data  = wp_json_encode($req->get_param('data') ?? []);
            $wpdb->insert(nb_get_logs_table(), compact('event', 'email', 'url', 'data'));
            return ['ok' => true];
        },
        'permission_callback' => '__return_true',
    ]);
});

/* ── Event Logs page ─────────────────────────────────────────────────────── */
function nb_event_logs_page(): void {
    global $wpdb;
    $table = nb_get_logs_table();

    // Filters
    $search     = isset($_GET['s'])     ? sanitize_text_field($_GET['s'])     : '';
    $event_f    = isset($_GET['event']) ? sanitize_text_field($_GET['event']) : '';
    $per_page   = 50;
    $page       = max(1, (int)($_GET['paged'] ?? 1));
    $offset     = ($page - 1) * $per_page;

    $where  = 'WHERE 1=1';
    $params = [];
    if ($search) {
        $where   .= ' AND (email LIKE %s OR event LIKE %s)';
        $params[] = '%' . $wpdb->esc_like($search) . '%';
        $params[] = '%' . $wpdb->esc_like($search) . '%';
    }
    if ($event_f) {
        $where   .= ' AND event = %s';
        $params[] = $event_f;
    }

    $sql_base  = "FROM {$table} {$where}";
    $total     = $params
        ? (int)$wpdb->get_var($wpdb->prepare("SELECT COUNT(*) {$sql_base}", ...$params))
        : (int)$wpdb->get_var("SELECT COUNT(*) {$sql_base}");

    $sql_rows  = "SELECT * {$sql_base} ORDER BY created_at DESC LIMIT %d OFFSET %d";
    $rows_params = array_merge($params, [$per_page, $offset]);
    $logs      = $wpdb->get_results($wpdb->prepare($sql_rows, ...$rows_params));

    $total_pages = max(1, ceil($total / $per_page));

    // Distinct events for filter dropdown
    $events = $wpdb->get_col("SELECT DISTINCT event FROM {$table} ORDER BY event");

    // Event badge colors
    $colors = [
        'reached_checkout'       => ['#2271b1','#dbeafe'],
        'email_entered'          => ['#2271b1','#dbeafe'],
        'klIdentify_called'      => ['#7c3aed','#ede9fe'],
        'klTrack_started_checkout'=>['#7c3aed','#ede9fe'],
        'attribution_captured'   => ['#2ea44f','#d4f4e0'],
        'klTrack_Added_to_Cart'  => ['#d97706','#fef3c7'],
        'payment_success'        => ['#2ea44f','#d4f4e0'],
        'payment_failed'         => ['#cf222e','#fee2e2'],
    ];
    $default_color = ['#555','#f3f4f6'];

    $tz = new DateTimeZone('America/Los_Angeles');
    ?>
    <div class="wrap">
    <h1 style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <span style="font-size:20px">📋</span> Event Logs
        <span style="font-size:12px;color:#888;font-weight:400"><?= $total ?> total events · Pacific Time</span>
    </h1>

    <!-- Filters -->
    <form method="get" style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;align-items:center">
        <input type="hidden" name="page" value="nb-event-logs">
        <input type="text" name="s" value="<?= esc_attr($search) ?>"
               placeholder="Search email or event…"
               style="padding:6px 12px;border:1px solid #ddd;border-radius:6px;font-size:13px;min-width:240px">
        <select name="event" style="padding:6px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px">
            <option value="">All events</option>
            <?php foreach ($events as $e): ?>
            <option value="<?= esc_attr($e) ?>" <?= selected($event_f, $e, false) ?>><?= esc_html($e) ?></option>
            <?php endforeach ?>
        </select>
        <button type="submit" style="padding:6px 14px;background:#1d2327;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer">Filter</button>
        <?php if ($search || $event_f): ?>
        <a href="?page=nb-event-logs" style="font-size:13px;color:#888">Clear</a>
        <?php endif ?>
        <span style="margin-left:auto;font-size:12px;color:#888">Page <?= $page ?> of <?= $total_pages ?></span>
    </form>

    <!-- Table -->
    <div style="background:#fff;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06)">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
                <tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb">
                    <th style="text-align:left;padding:12px 16px;color:#6b7280;font-weight:500;width:160px">Date</th>
                    <th style="text-align:left;padding:12px 16px;color:#6b7280;font-weight:500;width:160px">Time</th>
                    <th style="text-align:left;padding:12px 16px;color:#6b7280;font-weight:500">Event</th>
                    <th style="text-align:left;padding:12px 16px;color:#6b7280;font-weight:500">Email</th>
                    <th style="text-align:left;padding:12px 16px;color:#6b7280;font-weight:500">Details</th>
                </tr>
            </thead>
            <tbody>
            <?php if (empty($logs)): ?>
                <tr>
                    <td colspan="5" style="padding:40px;text-align:center;color:#aaa">
                        No logs yet. Events will appear here as customers use the store.
                    </td>
                </tr>
            <?php else: ?>
                <?php foreach ($logs as $log):
                    $dt  = new DateTime($log->created_at, new DateTimeZone('UTC'));
                    $dt->setTimezone($tz);
                    [$fc, $bc] = $colors[$log->event] ?? $default_color;
                    $data_arr = json_decode($log->data ?? '', true) ?? [];
                    $details  = '';
                    if (!empty($data_arr)) {
                        $parts = [];
                        foreach ($data_arr as $k => $v) {
                            if (is_scalar($v)) $parts[] = "<span style='color:#888'>{$k}:</span> " . esc_html($v);
                        }
                        $details = implode(' · ', array_slice($parts, 0, 3));
                    }
                ?>
                <tr style="border-bottom:1px solid #f3f4f6;transition:background .1s" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">
                    <td style="padding:12px 16px;color:#6b7280;font-family:monospace;font-size:12px">
                        <?= $dt->format('m-d') ?> <span style="color:#9ca3af"><?= $dt->format('H:i') ?></span>
                    </td>
                    <td style="padding:12px 16px;color:#9ca3af;font-family:monospace;font-size:12px">
                        <?= $dt->format('H:i:s') ?>
                    </td>
                    <td style="padding:12px 16px">
                        <span style="background:<?= $bc ?>;color:<?= $fc ?>;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600">
                            <?= esc_html($log->event) ?>
                        </span>
                    </td>
                    <td style="padding:12px 16px;color:<?= $log->email ? '#2271b1' : '#ccc' ?>">
                        <?= $log->email ? esc_html($log->email) : '—' ?>
                    </td>
                    <td style="padding:12px 16px;color:#6b7280;font-size:12px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                        <?= $details ?: ($log->url ? esc_html($log->url) : '—') ?>
                    </td>
                </tr>
                <?php endforeach ?>
            <?php endif ?>
            </tbody>
        </table>
    </div>

    <!-- Pagination -->
    <?php if ($total_pages > 1): ?>
    <div style="display:flex;gap:6px;margin-top:16px;justify-content:center">
        <?php for ($i = 1; $i <= $total_pages; $i++):
            $url = add_query_arg(['page' => 'nb-event-logs', 'paged' => $i, 's' => $search, 'event' => $event_f], admin_url('admin.php'));
        ?>
        <a href="<?= $url ?>"
           style="padding:6px 12px;border-radius:6px;font-size:13px;text-decoration:none;
                  background:<?= $i === $page ? '#1d2327' : '#f0f0f1' ?>;
                  color:<?= $i === $page ? '#fff' : '#1d2327' ?>">
            <?= $i ?>
        </a>
        <?php endfor ?>
    </div>
    <?php endif ?>
    </div>
    <?php
}

/* ── Funnel tracking helpers ─────────────────────────────────────────────── */

function nb_funnel_key(string $event, string $date): string {
    return "nb_funnel_{$event}_{$date}";
}

function nb_funnel_increment(string $event, string $date = ''): void {
    if (!$date) $date = (new DateTime('now', new DateTimeZone('America/Los_Angeles')))->format('Y-m-d');
    $key = nb_funnel_key($event, $date);
    $val = (int) get_option($key, 0);
    update_option($key, $val + 1, false);
}

function nb_funnel_get(string $event, string $date): int {
    return (int) get_option(nb_funnel_key($event, $date), 0);
}

function nb_funnel_range(string $event, int $days): int {
    $tz  = new DateTimeZone('America/Los_Angeles');
    $sum = 0;
    for ($i = 0; $i < $days; $i++) {
        $d    = new DateTime("now -$i days", $tz);
        $sum += nb_funnel_get($event, $d->format('Y-m-d'));
    }
    return $sum;
}

// All funnel events come from the headless Next.js frontend via REST.
// WooCommerce hooks won't fire for Square checkout flow.

// REST endpoint: track all funnel events from headless frontend
add_action('rest_api_init', function () {
    $valid_events = ['session', 'atc', 'checkout', 'purchased'];

    register_rest_route('nb/v1', '/funnel', [
        'methods'             => 'POST',
        'callback'            => function (WP_REST_Request $req) use ($valid_events) {
            $event = sanitize_text_field($req->get_param('event'));
            if (!in_array($event, $valid_events, true)) {
                return new WP_Error('invalid_event', 'Invalid event', ['status' => 400]);
            }
            nb_funnel_increment($event);
            return ['ok' => true, 'event' => $event];
        },
        'permission_callback' => '__return_true',
    ]);

    // Keep /session as alias for backwards compat
    register_rest_route('nb/v1', '/session', [
        'methods'             => 'POST',
        'callback'            => function () {
            nb_funnel_increment('session');
            return ['ok' => true];
        },
        'permission_callback' => '__return_true',
    ]);
});

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function nb_get_stats(string $from, string $to): array {
    $orders = wc_get_orders([
        'status'       => ['wc-completed', 'wc-processing'],
        'date_created' => $from . '...' . $to,
        'limit'        => -1,
    ]);

    $revenue = 0;
    foreach ($orders as $o) $revenue += (float) $o->get_total();

    return [
        'orders'  => count($orders),
        'revenue' => $revenue,
    ];
}

function nb_get_chart_data(int $days): array {
    $labels   = [];
    $revenues = [];
    $orders   = [];
    $tz       = new DateTimeZone('America/Los_Angeles');

    for ($i = $days - 1; $i >= 0; $i--) {
        $day   = new DateTime("now -$i days", $tz);
        $start = $day->format('Y-m-d') . ' 00:00:00';
        $end   = $day->format('Y-m-d') . ' 23:59:59';
        $stats = nb_get_stats($start, $end);

        $labels[]   = $day->format($days <= 7 ? 'D' : 'M j');
        $revenues[] = round($stats['revenue'], 2);
        $orders[]   = $stats['orders'];
    }

    return compact('labels', 'revenues', 'orders');
}

/* ── Helpers: top products ───────────────────────────────────────────────── */
function nb_get_top_products(string $from, string $to, int $limit = 5): array {
    $orders = wc_get_orders([
        'status'       => ['wc-completed', 'wc-processing'],
        'date_created' => $from . '...' . $to,
        'limit'        => -1,
    ]);
    $products = [];
    foreach ($orders as $order) {
        foreach ($order->get_items() as $item) {
            $name = $item->get_name();
            if (!isset($products[$name])) $products[$name] = 0;
            $products[$name] += (float) $item->get_total();
        }
    }
    arsort($products);
    return array_slice($products, 0, $limit, true);
}

function nb_get_sales_breakdown(string $from, string $to): array {
    $orders = wc_get_orders([
        'status'       => ['wc-completed', 'wc-processing'],
        'date_created' => $from . '...' . $to,
        'limit'        => -1,
    ]);
    $gross = $discounts = $shipping = $taxes = 0;
    foreach ($orders as $o) {
        $gross     += (float) $o->get_subtotal();
        $discounts += (float) $o->get_discount_total();
        $shipping  += (float) $o->get_shipping_total();
        $taxes     += (float) $o->get_total_tax();
    }
    $net   = $gross - $discounts;
    $total = $net + $shipping + $taxes;
    return compact('gross','discounts','shipping','taxes','net','total');
}

/* ── Page ────────────────────────────────────────────────────────────────── */
function nb_dashboard_page(): void {
    $view  = isset($_GET['view'])  ? sanitize_text_field($_GET['view']) : '';
    $range = isset($_GET['range']) ? (int) $_GET['range'] : 7;
    if (!in_array($range, [7, 14, 30], true)) $range = 7;
    if (!in_array($view, ['today', 'yesterday'], true)) $view = '';

    $tz    = new DateTimeZone('America/Los_Angeles');
    $now   = new DateTime('now', $tz);
    $today = new DateTime('now', $tz);
    $yest  = new DateTime('yesterday', $tz);

    $today_stats = nb_get_stats($today->format('Y-m-d 00:00:00'), $today->format('Y-m-d 23:59:59'));
    $yest_stats  = nb_get_stats($yest->format('Y-m-d 00:00:00'),  $yest->format('Y-m-d 23:59:59'));

    if ($view === 'today' || $view === 'yesterday') {
        $day_dt        = $view === 'today' ? $today : $yest;
        $prev_dt       = (clone $day_dt)->modify('-1 day');
        $focused_stats = $view === 'today' ? $today_stats : $yest_stats;
        $prev_stats    = nb_get_stats($prev_dt->format('Y-m-d 00:00:00'), $prev_dt->format('Y-m-d 23:59:59'));
        $from_dt       = $day_dt->format('Y-m-d 00:00:00');
        $to_dt         = $day_dt->format('Y-m-d 23:59:59');

        $labels = $revenues = $orders_arr = [];
        $current_hour = (int) $today->format('G');
        for ($h = 0; $h < 24; $h++) {
            if ($view === 'today' && $h > $current_hour) break;
            $from = $day_dt->format('Y-m-d') . sprintf(' %02d:00:00', $h);
            $to   = $day_dt->format('Y-m-d') . sprintf(' %02d:59:59', $h);
            $s    = nb_get_stats($from, $to);
            $labels[]     = ($h % 3 === 0) ? date('g A', mktime($h,0,0)) : '';
            $revenues[]   = round($s['revenue'], 2);
            $orders_arr[] = $s['orders'];
        }
        $chart       = ['labels' => $labels, 'revenues' => $revenues, 'orders' => $orders_arr];
        $main_rev    = $focused_stats['revenue'];
        $main_orders = $focused_stats['orders'];
        $main_avg    = $main_orders > 0 ? $main_rev / $main_orders : 0;
        $rev_delta   = $prev_stats['revenue'] > 0
            ? round((($main_rev - $prev_stats['revenue']) / $prev_stats['revenue']) * 100, 1) : 0;
        $ord_delta   = $prev_stats['orders'] > 0
            ? round((($main_orders - $prev_stats['orders']) / $prev_stats['orders']) * 100, 1) : 0;
        $period_label  = $view === 'today' ? 'Today' : 'Yesterday';
        $compare_label = $view === 'today' ? 'yesterday' : '2 days ago';
    } else {
        $period_from   = (new DateTime("now -{$range} days", $tz))->format('Y-m-d 00:00:00');
        $from_dt       = $period_from;
        $to_dt         = $today->format('Y-m-d 23:59:59');
        $focused_stats = nb_get_stats($from_dt, $to_dt);
        $chart         = nb_get_chart_data($range);
        $main_rev      = $focused_stats['revenue'];
        $main_orders   = $focused_stats['orders'];
        $main_avg      = $main_orders > 0 ? $main_rev / $main_orders : 0;
        $rev_delta     = null;
        $ord_delta     = null;
        $period_label  = "Last {$range} days";
        $compare_label = '';
    }

    // Sales breakdown
    $breakdown = nb_get_sales_breakdown($from_dt, $to_dt);

    // Top products
    $top_products = nb_get_top_products($from_dt, $to_dt, 5);
    $max_product_rev = $top_products ? max(array_values($top_products)) : 1;

    // Funnel data
    if ($view === 'today') {
        $f_date      = $today->format('Y-m-d');
        $f_sessions  = nb_funnel_get('session',   $f_date);
        $f_atc       = nb_funnel_get('atc',        $f_date);
        $f_checkout  = nb_funnel_get('checkout',   $f_date);
        $f_purchased = nb_funnel_get('purchased',  $f_date);
    } elseif ($view === 'yesterday') {
        $f_date      = $yest->format('Y-m-d');
        $f_sessions  = nb_funnel_get('session',   $f_date);
        $f_atc       = nb_funnel_get('atc',        $f_date);
        $f_checkout  = nb_funnel_get('checkout',   $f_date);
        $f_purchased = nb_funnel_get('purchased',  $f_date);
    } else {
        $f_sessions  = nb_funnel_range('session',   $range);
        $f_atc       = nb_funnel_range('atc',        $range);
        $f_checkout  = nb_funnel_range('checkout',   $range);
        $f_purchased = nb_funnel_range('purchased',  $range);
    }
    $f_base    = max($f_sessions, 1);
    $conv_rate = $f_sessions > 0 ? round($f_purchased / $f_sessions * 100, 1) : 0;
    $funnel    = [
        ['label' => 'Sessions',         'count' => $f_sessions,  'pct' => 100],
        ['label' => 'Added to Cart',    'count' => $f_atc,       'pct' => round($f_atc      / $f_base * 100, 1)],
        ['label' => 'Reached checkout', 'count' => $f_checkout,  'pct' => round($f_checkout / $f_base * 100, 1)],
        ['label' => 'Completed che…',   'count' => $f_purchased, 'pct' => round($f_purchased/ $f_base * 100, 1)],
    ];

    // Returning customer rate
    $all_orders = wc_get_orders(['status' => ['wc-completed','wc-processing'], 'date_created' => $from_dt . '...' . $to_dt, 'limit' => -1]);
    $customer_order_count = [];
    foreach ($all_orders as $o) {
        $email = $o->get_billing_email();
        if ($email) $customer_order_count[$email] = ($customer_order_count[$email] ?? 0) + 1;
    }
    $returning = count(array_filter($customer_order_count, fn($c) => $c > 1));
    $total_customers = count($customer_order_count);
    $returning_rate = $total_customers > 0 ? round($returning / $total_customers * 100) : 0;

    // Sessions chart (daily from funnel data for range views)
    $session_labels = $session_data = [];
    if (!$view) {
        for ($i = $range - 1; $i >= 0; $i--) {
            $d = new DateTime("now -$i days", $tz);
            $session_labels[] = $d->format($range <= 7 ? 'D' : 'M j');
            $session_data[]   = nb_funnel_get('session', $d->format('Y-m-d'));
        }
    } else {
        $session_labels = $chart['labels'];
        $session_data   = array_fill(0, count($chart['labels']), 0);
    }

    $refresh_time = $now->format('g:i a');
    $date_label   = $view === 'today' ? $today->format('M j, Y') : ($view === 'yesterday' ? $yest->format('M j, Y') : $today->format('M j, Y'));
    ?>
    <style>
    #nb-analytics * { box-sizing:border-box; }
    #nb-analytics { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:13px;color:#1a1a1a;background:#f6f6f7;margin:-20px -20px 0;padding:20px; }
    .nb-card { background:#fff;border:1px solid #e1e3e5;border-radius:8px;padding:16px 20px; }
    .nb-card-title { font-size:13px;font-weight:500;color:#303030;margin-bottom:2px; }
    .nb-big-num { font-size:22px;font-weight:700;color:#1a1a1a;line-height:1.2; }
    .nb-muted { color:#6d7175;font-size:12px; }
    .nb-delta-pos { color:#2a9d5c;font-weight:500; }
    .nb-delta-neg { color:#c9371c;font-weight:500; }
    .nb-tabs { display:flex;gap:0;margin-bottom:20px;border:1px solid #e1e3e5;border-radius:8px;overflow:hidden;width:fit-content;background:#f6f6f7; }
    .nb-tab { padding:7px 16px;font-size:13px;font-weight:500;text-decoration:none;color:#6d7175;border-right:1px solid #e1e3e5; }
    .nb-tab:last-child { border-right:none; }
    .nb-tab.active { background:#fff;color:#1a1a1a; }
    .nb-tab:hover:not(.active) { background:#fff; }
    .nb-grid-4 { display:grid;grid-template-columns:repeat(4,1fr);gap:16px; }
    .nb-grid-3 { display:grid;grid-template-columns:repeat(3,1fr);gap:16px; }
    .nb-grid-2 { display:grid;grid-template-columns:1fr 280px;gap:16px; }
    .nb-grid-2-rev { display:grid;grid-template-columns:280px 1fr;gap:16px; }
    @media(max-width:900px){ .nb-grid-4,.nb-grid-3,.nb-grid-2,.nb-grid-2-rev{ grid-template-columns:1fr 1fr; } }
    @media(max-width:600px){ .nb-grid-4,.nb-grid-3,.nb-grid-2,.nb-grid-2-rev{ grid-template-columns:1fr; } }
    .nb-row { display:flex;gap:16px;margin-top:16px; }
    .nb-sparkline { display:inline-block;width:80px;height:32px;vertical-align:middle; }
    .nb-divider { height:1px;background:#e1e3e5;margin:12px 0; }
    .nb-bd-row { display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13px; }
    .nb-bd-label { color:#303030; }
    .nb-bd-val { font-weight:500;color:#1a1a1a; }
    .nb-status { display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600; }
    .nb-funnel-bar { background:#4169e1;border-radius:3px 3px 0 0;transition:height .3s; }
    .nb-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px; }
    </style>

    <div id="nb-analytics">

    <!-- Header -->
    <div class="nb-header">
        <div>
            <h1 style="font-size:20px;font-weight:700;margin:0 0 2px;color:#1a1a1a">Analytics</h1>
            <span class="nb-muted">Last refreshed: <?= $refresh_time ?></span>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
            <span style="background:#fff;border:1px solid #e1e3e5;border-radius:6px;padding:6px 12px;font-size:13px;color:#303030">
                <?= $date_label ?> · <?= $period_label ?>
            </span>
            <span style="background:#fff;border:1px solid #e1e3e5;border-radius:6px;padding:6px 12px;font-size:13px;color:#303030">
                US$ USD
            </span>
        </div>
    </div>

    <!-- Range tabs -->
    <div class="nb-tabs" style="margin-bottom:20px">
        <?php
        $tabs = [
            ['href' => '?page=nb-dashboard&view=today',     'label' => 'Today',        'active' => $view === 'today'],
            ['href' => '?page=nb-dashboard&view=yesterday', 'label' => 'Yesterday',    'active' => $view === 'yesterday'],
            ['href' => '?page=nb-dashboard&range=7',        'label' => 'Last 7 days',  'active' => !$view && $range === 7],
            ['href' => '?page=nb-dashboard&range=14',       'label' => 'Last 14 days', 'active' => !$view && $range === 14],
            ['href' => '?page=nb-dashboard&range=30',       'label' => 'Last 30 days', 'active' => !$view && $range === 30],
        ];
        foreach ($tabs as $t): ?>
        <a href="<?= $t['href'] ?>" class="nb-tab <?= $t['active'] ? 'active' : '' ?>"><?= $t['label'] ?></a>
        <?php endforeach ?>
    </div>

    <!-- Top stat cards (Shopify style: value + tiny sparkline) -->
    <div class="nb-grid-4" style="margin-bottom:16px">
        <?php
        $stat_cards = [
            ['label' => 'Gross sales',            'value' => 'US$' . number_format($main_rev, 2),          'delta' => $rev_delta,  'cmp' => $compare_label],
            ['label' => 'Returning customer rate', 'value' => $returning_rate . '%',                         'delta' => null,        'cmp' => ''],
            ['label' => 'Orders fulfilled',        'value' => $main_orders,                                  'delta' => $ord_delta,  'cmp' => $compare_label],
            ['label' => 'Orders',                  'value' => $main_orders,                                  'delta' => null,        'cmp' => ''],
        ];
        foreach ($stat_cards as $sc):
            $d_class = $sc['delta'] === null ? '' : ($sc['delta'] >= 0 ? 'nb-delta-pos' : 'nb-delta-neg');
        ?>
        <div class="nb-card" style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
                <div class="nb-muted" style="margin-bottom:4px"><?= $sc['label'] ?></div>
                <div class="nb-big-num"><?= $sc['value'] ?></div>
                <?php if ($sc['delta'] !== null): ?>
                <div class="<?= $d_class ?>" style="font-size:11px;margin-top:3px">
                    <?= $sc['delta'] >= 0 ? '+' : '' ?><?= $sc['delta'] ?>% <?= $sc['cmp'] ? 'vs ' . $sc['cmp'] : '' ?>
                </div>
                <?php else: ?>
                <div class="nb-muted" style="font-size:11px;margin-top:3px">—</div>
                <?php endif ?>
            </div>
            <svg class="nb-sparkline" viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="0,28 20,22 40,18 60,10 80,6" stroke="#4169e1" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="80" cy="6" r="3" fill="#4169e1"/>
            </svg>
        </div>
        <?php endforeach ?>
    </div>

    <!-- Main area: Total sales over time + Sales breakdown sidebar -->
    <div class="nb-grid-2" style="margin-bottom:16px">
        <!-- Sales chart -->
        <div class="nb-card">
            <div class="nb-card-title">Total sales over time</div>
            <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px">
                <span class="nb-big-num">US$<?= number_format($main_rev, 2) ?></span>
                <?php if ($rev_delta !== null): ?>
                <span class="<?= $rev_delta >= 0 ? 'nb-delta-pos' : 'nb-delta-neg' ?>" style="font-size:12px">
                    <?= $rev_delta >= 0 ? '+' : '' ?><?= $rev_delta ?>%
                </span>
                <?php endif ?>
            </div>
            <div style="position:relative;height:220px;margin-top:12px"><canvas id="nb-sales-chart"></canvas></div>
            <div style="display:flex;justify-content:space-between;margin-top:6px" class="nb-muted">
                <span><?= $period_label ?></span>
                <span><?= $date_label ?></span>
            </div>
        </div>

        <!-- Sales breakdown -->
        <div class="nb-card">
            <div class="nb-card-title" style="margin-bottom:8px">Total sales breakdown</div>
            <?php
            $bd_rows = [
                ['Gross sales',      $breakdown['gross'],     '#4169e1'],
                ['Discounts',        -$breakdown['discounts'],'#6d7175'],
                ['Returns',          0,                       '#6d7175'],
                ['Net sales',        $breakdown['net'],       '#1a1a1a'],
                ['Shipping charges', $breakdown['shipping'],  '#6d7175'],
                ['Return fees',      0,                       '#6d7175'],
                ['Taxes',            $breakdown['taxes'],     '#6d7175'],
                ['Total sales',      $breakdown['total'],     '#1a1a1a'],
            ];
            foreach ($bd_rows as [$lbl, $val, $col]):
                $is_total = $lbl === 'Total sales' || $lbl === 'Net sales';
            ?>
            <div class="nb-bd-row" style="<?= $is_total ? 'border-top:1px solid #e1e3e5;margin-top:4px;padding-top:10px;' : '' ?>">
                <span class="nb-bd-label" style="color:<?= $col ?>;font-weight:<?= $is_total ? '600' : '400' ?>"><?= $lbl ?></span>
                <span class="nb-bd-val" style="color:<?= $col ?>">
                    <?= $val < 0 ? '-US$' . number_format(abs($val), 2) : 'US$' . number_format($val, 2) ?>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="vertical-align:middle;margin-left:2px"><path d="M5 7l2 2 2-4" stroke="#6d7175" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </span>
            </div>
            <?php endforeach ?>
        </div>
    </div>

    <!-- Sessions + Conversion rate + Sales by product row -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px">
        <!-- Sessions over time -->
        <div class="nb-card">
            <div class="nb-card-title">Sessions over time</div>
            <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:12px">
                <span class="nb-big-num"><?= number_format($f_sessions) ?></span>
                <span class="nb-muted" style="font-size:12px"><?= $period_label ?></span>
            </div>
            <div style="position:relative;height:140px"><canvas id="nb-sessions-chart"></canvas></div>
        </div>

        <!-- Conversion rate over time -->
        <div class="nb-card">
            <div class="nb-card-title">Conversion rate over time</div>
            <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:12px">
                <span class="nb-big-num"><?= $conv_rate ?>%</span>
                <span class="nb-muted" style="font-size:12px"><?= $period_label ?></span>
            </div>
            <div style="position:relative;height:140px"><canvas id="nb-conv-chart"></canvas></div>
        </div>

        <!-- Total sales by product -->
        <div class="nb-card">
            <div class="nb-card-title" style="margin-bottom:12px">Total sales by product</div>
            <?php if (empty($top_products)): ?>
            <p class="nb-muted">No sales data for this period.</p>
            <?php else: foreach ($top_products as $name => $rev):
                $bar_pct = round($rev / $max_product_rev * 100);
                $short   = strlen($name) > 28 ? substr($name, 0, 27) . '…' : $name;
            ?>
            <div style="margin-bottom:10px">
                <div style="display:flex;justify-content:space-between;margin-bottom:3px">
                    <span style="font-size:12px;color:#303030"><?= esc_html($short) ?></span>
                    <span style="font-size:12px;font-weight:500">US$<?= number_format($rev, 2) ?></span>
                </div>
                <div style="height:6px;background:#f6f6f7;border-radius:3px">
                    <div style="height:6px;width:<?= $bar_pct ?>%;background:#4169e1;border-radius:3px"></div>
                </div>
            </div>
            <?php endforeach; endif ?>
        </div>
    </div>

    <!-- Conversion funnel (Shopify style) -->
    <div class="nb-card" style="margin-bottom:16px">
        <div class="nb-card-title">Conversion rate breakdown</div>
        <div style="display:flex;align-items:baseline;gap:8px;margin:4px 0 20px">
            <span style="font-size:28px;font-weight:700"><?= $conv_rate ?>%</span>
            <span class="nb-muted">conversion rate</span>
        </div>

        <!-- Step stat headers -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-bottom:1px solid #e1e3e5;padding-bottom:12px;margin-bottom:0">
            <?php
            $step_blues = ['#4169e1','#4169e1','#7fa0f5','#b3c6fb'];
            foreach ($funnel as $i => $step): ?>
            <div style="border-top:3px solid <?= $step_blues[$i] ?>;padding-top:10px">
                <div class="nb-muted" style="margin-bottom:4px;font-size:12px"><?= $step['label'] ?></div>
                <div style="font-size:18px;font-weight:700"><?= $step['pct'] ?>%
                    <span style="font-size:13px;font-weight:400;color:#6d7175"><?= number_format($step['count']) ?></span>
                </div>
            </div>
            <?php endforeach ?>
        </div>

        <!-- Funnel bar chart -->
        <div style="display:flex;align-items:flex-end;gap:4px;height:120px;margin-top:16px">
            <?php foreach ($funnel as $i => $step):
                $h = max(3, $step['pct']);
            ?>
            <div style="flex:1;height:100%;display:flex;align-items:flex-end">
                <div style="width:100%;height:<?= $h ?>%;background:<?= $step_blues[$i] ?>;border-radius:4px 4px 0 0;opacity:<?= $i === 0 ? '1' : '0.7' ?>"></div>
            </div>
            <?php endforeach ?>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);margin-top:6px">
            <?php foreach ($funnel as $step): ?>
            <div class="nb-muted" style="font-size:11px;text-align:center"><?= $step['label'] ?></div>
            <?php endforeach ?>
        </div>
    </div>

    <!-- Average order value + Recent orders -->
    <div class="nb-grid-2" style="margin-bottom:16px">
        <!-- AOV chart -->
        <div class="nb-card">
            <div class="nb-card-title">Average order value over time</div>
            <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:12px">
                <span class="nb-big-num">US$<?= number_format($main_avg, 2) ?></span>
                <span class="nb-muted" style="font-size:12px"><?= $period_label ?></span>
            </div>
            <div style="position:relative;height:160px"><canvas id="nb-aov-chart"></canvas></div>
        </div>

        <!-- Recent orders -->
        <div class="nb-card">
            <div class="nb-card-title" style="margin-bottom:12px">Recent orders</div>
            <?php
            $recent = wc_get_orders(['limit' => 6, 'orderby' => 'date', 'order' => 'DESC']);
            $status_map = [
                'wc-completed'  => ['#2a9d5c','#d4f4e0'],
                'wc-processing' => ['#4169e1','#e0e8ff'],
                'wc-pending'    => ['#c07b0a','#fef3c7'],
                'wc-cancelled'  => ['#c9371c','#fee2e2'],
                'wc-refunded'   => ['#6d7175','#f3f4f6'],
            ];
            foreach ($recent as $order):
                $status = 'wc-' . $order->get_status();
                [$fc, $bc] = $status_map[$status] ?? ['#555','#eee'];
                $name = trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name()) ?: $order->get_billing_email();
            ?>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f1f1f1">
                <div>
                    <a href="<?= get_edit_post_link($order->get_id()) ?>" style="color:#4169e1;font-weight:600;font-size:13px">#<?= $order->get_id() ?></a>
                    <span style="color:#6d7175;font-size:12px;margin-left:8px"><?= esc_html($name) ?></span>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                    <span class="nb-status" style="background:<?= $bc ?>;color:<?= $fc ?>"><?= ucfirst(str_replace('wc-','',$status)) ?></span>
                    <span style="font-weight:600;font-size:13px">US$<?= number_format((float)$order->get_total(),2) ?></span>
                </div>
            </div>
            <?php endforeach ?>
        </div>
    </div>

    </div><!-- nb-analytics -->

    <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
    <script>
    const NB_BLUE      = '#4169e1';
    const NB_BLUE_FILL = 'rgba(65,105,225,0.08)';

    function nbChart(id, labels, data, tickCb) {
        const el = document.getElementById(id);
        if (!el) return;
        new Chart(el.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    borderColor: NB_BLUE,
                    backgroundColor: NB_BLUE_FILL,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: labels.length <= 14 ? 3 : 0,
                    pointBackgroundColor: NB_BLUE,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: { backgroundColor: '#1a1a1a', titleFont: { size: 12 }, bodyFont: { size: 12 } }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#6d7175', font: { size: 11 }, maxTicksLimit: 8 } },
                    y: { grid: { color: '#f0f0f0' }, ticks: { color: '#6d7175', font: { size: 11 }, callback: tickCb || (v => v) } }
                }
            }
        });
    }

    const salesLabels  = <?= json_encode($chart['labels']) ?>;
    const salesRevenue = <?= json_encode($chart['revenues']) ?>;
    const salesOrders  = <?= json_encode($chart['orders']) ?>;
    const sessLabels   = <?= json_encode($session_labels) ?>;
    const sessData     = <?= json_encode($session_data) ?>;
    const convRate     = <?= (float)$conv_rate ?>;

    <?php
    $aov_data = [];
    foreach ($chart['revenues'] as $i => $r) {
        $o = $chart['orders'][$i] ?? 0;
        $aov_data[] = $o > 0 ? round($r / $o, 2) : 0;
    }
    ?>
    const aovData = <?= json_encode($aov_data) ?>;

    nbChart('nb-sales-chart',    salesLabels, salesRevenue, v => 'US$' + v);
    nbChart('nb-sessions-chart', sessLabels,  sessData,     v => v);
    nbChart('nb-conv-chart',     sessLabels,  sessLabels.map(() => convRate), v => v + '%');
    nbChart('nb-aov-chart',      salesLabels, aovData,      v => 'US$' + v);
    </script>
    <?php
}
