<?php
/**
 * Plugin Name: Noir & Blanc Sales Dashboard
 * Description: Daily sales analytics dashboard for WooCommerce
 * Version: 1.0
 */

if (!defined('ABSPATH')) exit;

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
});

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

// Hook: track add-to-cart (WooCommerce REST/session)
add_action('woocommerce_add_to_cart', function () {
    nb_funnel_increment('atc');
});

// Hook: track reached checkout (order created = checkout page submitted)
add_action('woocommerce_checkout_order_created', function () {
    nb_funnel_increment('checkout');
});

// Hook: track completed purchase
add_action('woocommerce_payment_complete', function () {
    nb_funnel_increment('purchased');
});
add_action('woocommerce_order_status_processing', function () {
    nb_funnel_increment('purchased');
});

// REST endpoint: track sessions from headless Next.js frontend
add_action('rest_api_init', function () {
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

/* ── Page ────────────────────────────────────────────────────────────────── */
function nb_dashboard_page(): void {
    $view  = isset($_GET['view'])  ? sanitize_text_field($_GET['view']) : '';
    $range = isset($_GET['range']) ? (int) $_GET['range'] : 7;
    if (!in_array($range, [7, 14, 30], true)) $range = 7;
    if (!in_array($view, ['today', 'yesterday'], true)) $view = '';

    $tz    = new DateTimeZone('America/Los_Angeles');
    $today = new DateTime('now', $tz);
    $yest  = new DateTime('yesterday', $tz);

    $today_stats = nb_get_stats($today->format('Y-m-d 00:00:00'), $today->format('Y-m-d 23:59:59'));
    $yest_stats  = nb_get_stats($yest->format('Y-m-d 00:00:00'),  $yest->format('Y-m-d 23:59:59'));

    // For single-day views, use hourly breakdown (24 points)
    if ($view === 'today' || $view === 'yesterday') {
        $day_dt = $view === 'today' ? $today : $yest;
        $prev_dt = clone $day_dt;
        $prev_dt->modify('-1 day');
        $focused_stats = $view === 'today' ? $today_stats : $yest_stats;
        $prev_stats    = nb_get_stats($prev_dt->format('Y-m-d 00:00:00'), $prev_dt->format('Y-m-d 23:59:59'));

        // hourly chart data
        $labels = $revenues = $orders_arr = [];
        $current_hour = (int) $today->format('G');
        for ($h = 0; $h < 24; $h++) {
            if ($view === 'today' && $h > $current_hour) break;
            $from = $day_dt->format('Y-m-d') . sprintf(' %02d:00:00', $h);
            $to   = $day_dt->format('Y-m-d') . sprintf(' %02d:59:59', $h);
            $s    = nb_get_stats($from, $to);
            $labels[]     = ($h % 3 === 0) ? date('g A', strtotime($from)) : '';
            $revenues[]   = round($s['revenue'], 2);
            $orders_arr[] = $s['orders'];
        }
        $chart = ['labels' => $labels, 'revenues' => $revenues, 'orders' => $orders_arr];

        $rev_delta = $prev_stats['revenue'] > 0
            ? round((($focused_stats['revenue'] - $prev_stats['revenue']) / $prev_stats['revenue']) * 100, 1) : 0;
        $ord_delta = $prev_stats['orders'] > 0
            ? round((($focused_stats['orders'] - $prev_stats['orders']) / $prev_stats['orders']) * 100, 1) : 0;

        $period_label = $view === 'today' ? "Today" : "Yesterday";
        $compare_label = $view === 'today' ? "yesterday" : "2 days ago";
        $cards = [
            ['label' => $period_label . ' Revenue', 'value' => '$' . number_format($focused_stats['revenue'], 2), 'delta' => $rev_delta, 'compare' => $compare_label, 'icon' => '💰'],
            ['label' => $period_label . ' Orders',  'value' => $focused_stats['orders'],                          'delta' => $ord_delta, 'compare' => $compare_label, 'icon' => '📦'],
            ['label' => 'Prev Day Revenue',         'value' => '$' . number_format($prev_stats['revenue'], 2),    'delta' => null, 'icon' => '📈'],
            ['label' => 'Prev Day Orders',          'value' => $prev_stats['orders'],                             'delta' => null, 'icon' => '🛍️'],
        ];
        $chart_subtitle = $view === 'today' ? 'Today by hour' : 'Yesterday by hour';
    } else {
        // period stats
        $period_from  = (new DateTime("now -{$range} days", $tz))->format('Y-m-d 00:00:00');
        $period_stats = nb_get_stats($period_from, $today->format('Y-m-d 23:59:59'));
        $chart = nb_get_chart_data($range);

        $rev_delta = $yest_stats['revenue'] > 0
            ? round((($today_stats['revenue'] - $yest_stats['revenue']) / $yest_stats['revenue']) * 100, 1) : 0;
        $ord_delta = $yest_stats['orders'] > 0
            ? round((($today_stats['orders'] - $yest_stats['orders']) / $yest_stats['orders']) * 100, 1) : 0;

        $cards = [
            ['label' => "Today's Revenue",   'value' => '$' . number_format($today_stats['revenue'], 2),  'delta' => $rev_delta, 'compare' => 'yesterday', 'icon' => '💰'],
            ['label' => "Today's Orders",    'value' => $today_stats['orders'],                            'delta' => $ord_delta, 'compare' => 'yesterday', 'icon' => '📦'],
            ['label' => "{$range}d Revenue", 'value' => '$' . number_format($period_stats['revenue'], 2),  'delta' => null, 'icon' => '📈'],
            ['label' => "{$range}d Orders",  'value' => $period_stats['orders'],                           'delta' => null, 'icon' => '🛍️'],
        ];
        $chart_subtitle = "Last {$range} days";
    }

    // Funnel data for selected range/view
    if ($view === 'today') {
        $f_date   = $today->format('Y-m-d');
        $f_sessions  = nb_funnel_get('session',   $f_date);
        $f_atc       = nb_funnel_get('atc',        $f_date);
        $f_checkout  = nb_funnel_get('checkout',   $f_date);
        $f_purchased = nb_funnel_get('purchased',  $f_date);
    } elseif ($view === 'yesterday') {
        $f_date   = $yest->format('Y-m-d');
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

    $f_base = max($f_sessions, 1);
    $funnel_steps = [
        ['label' => 'Sessions',          'count' => $f_sessions,  'pct' => 100],
        ['label' => 'Added to Cart',     'count' => $f_atc,       'pct' => round($f_atc       / $f_base * 100, 1)],
        ['label' => 'Reached Checkout',  'count' => $f_checkout,  'pct' => round($f_checkout  / $f_base * 100, 1)],
        ['label' => 'Completed Order',   'count' => $f_purchased, 'pct' => round($f_purchased / $f_base * 100, 1)],
    ];
    $conv_rate = $f_sessions > 0 ? round($f_purchased / $f_sessions * 100, 1) : 0;

    ?>
    <div class="wrap" id="nb-dash">
    <h1 style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
        <span style="font-size:22px">📊</span> Sales Dashboard
        <span style="font-size:13px;color:#888;font-weight:400">Pacific Time</span>
    </h1>

    <!-- Range tabs -->
    <div style="margin-bottom:20px;display:flex;gap:6px;flex-wrap:wrap">
        <?php
        $tabs = [
            ['href' => '?page=nb-dashboard&view=today',     'label' => 'Today',       'active' => $view === 'today'],
            ['href' => '?page=nb-dashboard&view=yesterday', 'label' => 'Yesterday',   'active' => $view === 'yesterday'],
            ['href' => '?page=nb-dashboard&range=7',        'label' => 'Last 7 days', 'active' => !$view && $range === 7],
            ['href' => '?page=nb-dashboard&range=14',       'label' => 'Last 14 days','active' => !$view && $range === 14],
            ['href' => '?page=nb-dashboard&range=30',       'label' => 'Last 30 days','active' => !$view && $range === 30],
        ];
        foreach ($tabs as $tab): ?>
            <a href="<?= $tab['href'] ?>"
               style="padding:6px 14px;border-radius:6px;font-size:13px;font-weight:500;text-decoration:none;
                      background:<?= $tab['active'] ? '#1d2327' : '#f0f0f1' ?>;
                      color:<?= $tab['active'] ? '#fff' : '#1d2327' ?>">
                <?= $tab['label'] ?>
            </a>
        <?php endforeach ?>
    </div>

    <!-- Stat cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px">
        <?php foreach ($cards as $c):
            $dcolor = ($c['delta'] ?? 0) >= 0 ? '#2ea44f' : '#cf222e';
        ?>
        <div style="background:#fff;border:1px solid #e0e0e0;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.06)">
            <div style="font-size:22px;margin-bottom:6px"><?= $c['icon'] ?></div>
            <div style="font-size:12px;color:#666;margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em"><?= $c['label'] ?></div>
            <div style="font-size:26px;font-weight:700;color:#1d2327"><?= $c['value'] ?></div>
            <?php if ($c['delta'] !== null): ?>
            <div style="font-size:12px;margin-top:4px;color:<?= $dcolor ?>">
                <?= $c['delta'] >= 0 ? '▲' : '▼' ?> <?= abs($c['delta']) ?>% vs <?= $c['compare'] ?>
            </div>
            <?php endif ?>
        </div>
        <?php endforeach ?>
    </div>

    <!-- Chart -->
    <div style="background:#fff;border:1px solid #e0e0e0;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.06)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
            <div>
                <div style="font-size:15px;font-weight:600;color:#1d2327">Revenue & Orders over time</div>
                <div style="font-size:12px;color:#888;margin-top:2px"><?= $chart_subtitle ?></div>
            </div>
            <div style="display:flex;gap:16px;font-size:12px">
                <span><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#2271b1;margin-right:4px;vertical-align:middle"></span>Revenue</span>
                <span><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#2ea44f;margin-right:4px;vertical-align:middle"></span>Orders</span>
            </div>
        </div>
        <canvas id="nb-chart" style="width:100%;max-height:300px"></canvas>
    </div>

    <!-- Conversion funnel -->
    <div style="background:#fff;border:1px solid #e0e0e0;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.06);margin-top:20px">
        <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:6px">
            <div style="font-size:15px;font-weight:600;color:#1d2327">Conversion rate breakdown</div>
        </div>
        <div style="font-size:28px;font-weight:700;color:#1d2327;margin-bottom:20px">
            <?= $conv_rate ?>% <span style="font-size:14px;color:#888;font-weight:400">conversion rate</span>
        </div>

        <!-- Step labels + counts -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
            <?php
            $step_colors = ['#2271b1','#3b82f6','#93c5fd','#bfdbfe'];
            foreach ($funnel_steps as $i => $step):
            ?>
            <div style="border-top:3px solid <?= $step_colors[$i] ?>;padding-top:10px">
                <div style="font-size:12px;color:#888;margin-bottom:4px"><?= $step['label'] ?></div>
                <div style="font-size:20px;font-weight:700;color:#1d2327"><?= $step['pct'] ?>%
                    <span style="font-size:13px;font-weight:500;color:#555"><?= $step['count'] ?></span>
                </div>
            </div>
            <?php endforeach ?>
        </div>

        <!-- Funnel bars -->
        <div style="display:flex;align-items:flex-end;gap:3px;height:140px;padding-top:10px">
            <?php foreach ($funnel_steps as $i => $step):
                $h = max(4, $step['pct']);
            ?>
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end">
                <div style="width:100%;background:<?= $step_colors[$i] ?>;height:<?= $h ?>%;border-radius:6px 6px 0 0;opacity:0.85;transition:height .4s"></div>
            </div>
            <?php endforeach ?>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:8px">
            <?php foreach ($funnel_steps as $step): ?>
            <div style="font-size:11px;color:#aaa;text-align:center"><?= $step['label'] ?></div>
            <?php endforeach ?>
        </div>

        <?php if ($f_sessions === 0): ?>
        <div style="margin-top:16px;padding:12px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:12px;color:#92400e">
            ⚠️ No session data yet. Sessions are tracked automatically once the Next.js store pings the tracking endpoint.
        </div>
        <?php endif ?>
    </div>

    <!-- Recent orders table -->
    <div style="background:#fff;border:1px solid #e0e0e0;border-radius:12px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,.06);margin-top:20px">
        <div style="font-size:15px;font-weight:600;color:#1d2327;margin-bottom:16px">Recent Orders</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
                <tr style="border-bottom:2px solid #f0f0f0">
                    <th style="text-align:left;padding:8px 12px;color:#888;font-weight:500">Order</th>
                    <th style="text-align:left;padding:8px 12px;color:#888;font-weight:500">Customer</th>
                    <th style="text-align:left;padding:8px 12px;color:#888;font-weight:500">Date</th>
                    <th style="text-align:left;padding:8px 12px;color:#888;font-weight:500">Status</th>
                    <th style="text-align:right;padding:8px 12px;color:#888;font-weight:500">Total</th>
                </tr>
            </thead>
            <tbody>
            <?php
            $recent = wc_get_orders(['limit' => 10, 'orderby' => 'date', 'order' => 'DESC']);
            $status_colors = [
                'wc-completed'  => ['#2ea44f', '#d4f4e0'],
                'wc-processing' => ['#2271b1', '#dbeafe'],
                'wc-pending'    => ['#d97706', '#fef3c7'],
                'wc-cancelled'  => ['#cf222e', '#fee2e2'],
                'wc-refunded'   => ['#6b7280', '#f3f4f6'],
            ];
            foreach ($recent as $order):
                $status = 'wc-' . $order->get_status();
                [$fc, $bc] = $status_colors[$status] ?? ['#555', '#eee'];
                $name = trim($order->get_billing_first_name() . ' ' . $order->get_billing_last_name()) ?: $order->get_billing_email();
            ?>
            <tr style="border-bottom:1px solid #f5f5f5">
                <td style="padding:10px 12px">
                    <a href="<?= get_edit_post_link($order->get_id()) ?>" style="color:#2271b1;font-weight:600">#<?= $order->get_id() ?></a>
                </td>
                <td style="padding:10px 12px;color:#444"><?= esc_html($name) ?></td>
                <td style="padding:10px 12px;color:#888"><?= $order->get_date_created()->date('M j, g:i a') ?></td>
                <td style="padding:10px 12px">
                    <span style="background:<?= $bc ?>;color:<?= $fc ?>;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;text-transform:capitalize">
                        <?= str_replace('wc-', '', $status) ?>
                    </span>
                </td>
                <td style="padding:10px 12px;text-align:right;font-weight:600;color:#1d2327">$<?= number_format((float)$order->get_total(), 2) ?></td>
            </tr>
            <?php endforeach ?>
            </tbody>
        </table>
    </div>

    </div><!-- wrap -->

    <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
    <script>
    const ctx = document.getElementById('nb-chart').getContext('2d');
    new Chart(ctx, {
        data: {
            labels: <?= json_encode($chart['labels']) ?>,
            datasets: [
                {
                    type: 'bar',
                    label: 'Revenue ($)',
                    data: <?= json_encode($chart['revenues']) ?>,
                    backgroundColor: 'rgba(34,113,177,0.15)',
                    borderColor: '#2271b1',
                    borderWidth: 2,
                    borderRadius: 6,
                    yAxisID: 'y',
                },
                {
                    type: 'line',
                    label: 'Orders',
                    data: <?= json_encode($chart['orders']) ?>,
                    borderColor: '#2ea44f',
                    backgroundColor: 'rgba(46,164,79,0.08)',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#2ea44f',
                    pointRadius: 4,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1',
                }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ctx.datasetIndex === 0
                            ? ' $' + ctx.parsed.y.toFixed(2)
                            : ' ' + ctx.parsed.y + ' orders'
                    }
                }
            },
            scales: {
                x: { grid: { display: false } },
                y:  { position: 'left',  grid: { color: '#f5f5f5' }, ticks: { callback: v => '$' + v } },
                y1: { position: 'right', grid: { display: false },   ticks: { stepSize: 1 } },
            }
        }
    });
    </script>
    <?php
}
