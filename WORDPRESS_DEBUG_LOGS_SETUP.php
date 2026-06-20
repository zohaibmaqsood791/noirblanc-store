<?php
/**
 * WordPress Debug Logs Setup
 * Add this code to your WordPress site (noirblanc.store)
 *
 * Option 1: Add to wp-content/mu-plugins/debug-logs.php
 * Option 2: Add to functions.php in your child theme
 * Option 3: Create as a plugin and upload
 */

// Create custom table on plugin activation
function debug_logs_create_table() {
  global $wpdb;
  $table_name = $wpdb->prefix . 'debug_logs';
  $charset_collate = $wpdb->get_charset_collate();

  $sql = "CREATE TABLE IF NOT EXISTS $table_name (
    id mediumint(9) NOT NULL AUTO_INCREMENT,
    timestamp datetime DEFAULT CURRENT_TIMESTAMP,
    event varchar(100) NOT NULL,
    email varchar(255),
    data longtext,
    url varchar(255),
    store varchar(50),
    PRIMARY KEY  (id),
    KEY event (event),
    KEY email (email),
    KEY timestamp (timestamp)
  ) $charset_collate;";

  require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
  dbDelta($sql);
}
register_activation_hook(__FILE__, 'debug_logs_create_table');

// REST API endpoint to receive logs
add_action('rest_api_init', function () {
  register_rest_route('custom/v1', '/debug-logs', array(
    'methods' => 'POST',
    'callback' => 'handle_debug_log',
    'permission_callback' => '__return_true', // Allow public posts (secure later with nonce if needed)
  ));

  register_rest_route('custom/v1', '/debug-logs', array(
    'methods' => 'GET',
    'callback' => 'get_debug_logs',
    'permission_callback' => 'is_user_logged_in', // Only logged-in users can view
  ));
});

// Handle incoming logs
function handle_debug_log($request) {
  global $wpdb;
  $table_name = $wpdb->prefix . 'debug_logs';

  $params = $request->get_json_params();

  $wpdb->insert(
    $table_name,
    array(
      'timestamp' => current_time('mysql'),
      'event' => sanitize_text_field($params['event'] ?? ''),
      'email' => sanitize_email($params['email'] ?? ''),
      'data' => wp_json_encode($params['data'] ?? []),
      'url' => esc_url($params['url'] ?? ''),
      'store' => sanitize_text_field($params['store'] ?? ''),
    ),
    array('%s', '%s', '%s', '%s', '%s', '%s')
  );

  return new WP_REST_Response(['success' => true, 'id' => $wpdb->insert_id]);
}

// Get logs (for logged-in users)
function get_debug_logs($request) {
  global $wpdb;
  $table_name = $wpdb->prefix . 'debug_logs';

  $hours = intval($request->get_param('hours')) ?? 24; // Default: last 24 hours
  $limit = intval($request->get_param('limit')) ?? 100;

  $logs = $wpdb->get_results($wpdb->prepare(
    "SELECT * FROM $table_name
     WHERE timestamp > DATE_SUB(NOW(), INTERVAL %d HOUR)
     ORDER BY timestamp DESC
     LIMIT %d",
    $hours,
    $limit
  ));

  return new WP_REST_Response(['logs' => $logs, 'count' => count($logs)]);
}

// Admin page to view logs
add_action('admin_menu', function () {
  add_submenu_page(
    'woocommerce',
    'Checkout Debug Logs',
    'Debug Logs',
    'manage_woocommerce',
    'debug-logs-viewer',
    'render_debug_logs_page'
  );
});

function render_debug_logs_page() {
  global $wpdb;
  $table_name = $wpdb->prefix . 'debug_logs';

  // Get logs from last 7 days
  $logs = $wpdb->get_results(
    "SELECT * FROM $table_name
     WHERE timestamp > DATE_SUB(NOW(), INTERVAL 7 DAY)
     ORDER BY timestamp DESC
     LIMIT 500"
  );

  echo '<div class="wrap">';
  echo '<h1>Headless Checkout Debug Logs</h1>';
  echo '<p style="color: #666;">Logs from last 7 days</p>';

  if (empty($logs)) {
    echo '<p>No logs found.</p>';
    echo '</div>';
    return;
  }

  echo '<table class="wp-list-table widefat striped">';
  echo '<thead><tr>';
  echo '<th>Time</th>';
  echo '<th>Event</th>';
  echo '<th>Email</th>';
  echo '<th>URL</th>';
  echo '<th>Data</th>';
  echo '</tr></thead>';
  echo '<tbody>';

  foreach ($logs as $log) {
    $data = json_decode($log->data, true);
    echo '<tr>';
    echo '<td>' . esc_html(substr($log->timestamp, 5, 11) . ' ' . substr($log->timestamp, 11, 8)) . '</td>';
    echo '<td><strong>' . esc_html($log->event) . '</strong></td>';
    echo '<td>' . esc_html($log->email) . '</td>';
    echo '<td>' . esc_html($log->url) . '</td>';
    echo '<td><small><code>' . esc_html(wp_json_encode($data)) . '</code></small></td>';
    echo '</tr>';
  }

  echo '</tbody>';
  echo '</table>';

  // Stats
  echo '<h2>Stats (Last 7 Days)</h2>';
  $stats = $wpdb->get_results(
    "SELECT
      event,
      COUNT(*) as count,
      COUNT(DISTINCT email) as unique_emails
     FROM $table_name
     WHERE timestamp > DATE_SUB(NOW(), INTERVAL 7 DAY)
     GROUP BY event
     ORDER BY count DESC"
  );

  echo '<table class="wp-list-table widefat striped">';
  echo '<thead><tr><th>Event</th><th>Count</th><th>Unique Emails</th></tr></thead>';
  echo '<tbody>';
  foreach ($stats as $stat) {
    echo '<tr>';
    echo '<td>' . esc_html($stat->event) . '</td>';
    echo '<td>' . esc_html($stat->count) . '</td>';
    echo '<td>' . esc_html($stat->unique_emails) . '</td>';
    echo '</tr>';
  }
  echo '</tbody>';
  echo '</table>';

  echo '</div>';
}

// Create table on first load
debug_logs_create_table();
