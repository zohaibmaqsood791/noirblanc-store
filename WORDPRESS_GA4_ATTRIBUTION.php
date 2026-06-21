<?php
/**
 * GA4 API Integration for Order Attribution
 * Queries GA4 to find the actual traffic source for each order
 * Add to functions.php in your WordPress theme
 */

// Store GA4 credentials
define('GA4_PROPERTY_ID', '000000000'); // Replace with your GA4 Property ID (number only, no GT-)
define('GA4_SERVICE_ACCOUNT_JSON', json_encode([
  "type" => "service_account",
  "project_id" => "your-project-id",
  "private_key_id" => "your-private-key-id",
  "private_key" => "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email" => "your-service-account@your-project.iam.gserviceaccount.com",
  "client_id" => "your-client-id",
  "auth_uri" => "https://accounts.google.com/o/oauth2/auth",
  "token_uri" => "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url" => "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url" => "https://www.googleapis.com/robot/v1/metadata/x509/..."
]));

// Get GA4 access token
function get_ga4_access_token() {
  $service_account = json_decode(GA4_SERVICE_ACCOUNT_JSON, true);

  $header = json_encode([
    'alg' => 'RS256',
    'typ' => 'JWT'
  ]);

  $now = time();
  $payload = json_encode([
    'iss' => $service_account['client_email'],
    'scope' => 'https://www.googleapis.com/auth/analytics.readonly',
    'aud' => 'https://oauth2.googleapis.com/token',
    'exp' => $now + 3600,
    'iat' => $now
  ]);

  $header_payload = base64_encode($header) . '.' . base64_encode($payload);

  $private_key = $service_account['private_key'];
  openssl_sign($header_payload, $signature, $private_key, 'sha256');
  $jwt = $header_payload . '.' . base64_encode($signature);

  $response = wp_remote_post('https://oauth2.googleapis.com/token', [
    'body' => [
      'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      'assertion' => $jwt
    ]
  ]);

  if (is_wp_error($response)) {
    return null;
  }

  $data = json_decode(wp_remote_retrieve_body($response), true);
  return $data['access_token'] ?? null;
}

// Query GA4 for traffic source
function get_ga4_traffic_source($customer_email, $order_date) {
  $access_token = get_ga4_access_token();
  if (!$access_token) {
    return null;
  }

  // Convert order date to GA4 date range (1 day)
  $date = date('Ymd', strtotime($order_date));

  $body = json_encode([
    'dateRanges' => [[
      'startDate' => $date,
      'endDate' => $date
    ]],
    'dimensions' => [
      ['name' => 'sessionDefaultChannelGroup'],
      ['name' => 'sessionSource'],
      ['name' => 'sessionMedium'],
      ['name' => 'userEmail']
    ],
    'metrics' => [['name' => 'eventCount']],
    'dimensionFilter' => [
      'filter' => [
        'fieldName' => 'userEmail',
        'stringFilter' => [
          'matchType' => 'EXACT',
          'value' => $customer_email
        ]
      ]
    ]
  ]);

  $response = wp_remote_post("https://analyticsdata.googleapis.com/v1beta/properties/" . GA4_PROPERTY_ID . ":runReport", [
    'headers' => [
      'Authorization' => 'Bearer ' . $access_token,
      'Content-Type' => 'application/json'
    ],
    'body' => $body
  ]);

  if (is_wp_error($response)) {
    return null;
  }

  $data = json_decode(wp_remote_retrieve_body($response), true);

  if (empty($data['rows'])) {
    return null;
  }

  // Return first matching row
  $row = $data['rows'][0];
  $dimensions = $row['dimensionValues'];

  return [
    'channel' => $dimensions[0]['value'] ?? 'Direct',
    'source' => $dimensions[1]['value'] ?? 'direct',
    'medium' => $dimensions[2]['value'] ?? 'direct'
  ];
}

// Hook into order creation
add_action('woocommerce_new_order', function($order_id, $order) {
  $customer_email = $order->get_billing_email();
  $order_date = $order->get_date_created()->format('Y-m-d H:i:s');

  // Try GA4 first
  $ga4_data = get_ga4_traffic_source($customer_email, $order_date);

  if ($ga4_data && !empty($ga4_data['source'])) {
    // Use GA4 data
    update_post_meta($order_id, '_order_attribution_source', sanitize_text_field($ga4_data['source']));
    update_post_meta($order_id, '_order_attribution_medium', sanitize_text_field($ga4_data['medium']));
    update_post_meta($order_id, '_order_ga4_channel', sanitize_text_field($ga4_data['channel']));
  } else {
    // Fallback to debug logs (old method)
    global $wpdb;
    $logs_table = $wpdb->prefix . 'debug_logs';
    $log = $wpdb->get_row($wpdb->prepare(
      "SELECT data FROM $logs_table
       WHERE event = 'attribution_captured'
       AND email = %s
       ORDER BY timestamp DESC
       LIMIT 1",
      $customer_email
    ));

    if ($log && $log->data) {
      $data = json_decode($log->data, true);
      if (!empty($data['source'])) {
        update_post_meta($order_id, '_order_attribution_source', sanitize_text_field($data['source']));
        if (!empty($data['medium'])) {
          update_post_meta($order_id, '_order_attribution_medium', sanitize_text_field($data['medium']));
        }
        if (!empty($data['campaign'])) {
          update_post_meta($order_id, '_order_attribution_campaign', sanitize_text_field($data['campaign']));
        }
      }
    }
  }
}, 10, 2);

// Display in order details
add_action('woocommerce_admin_order_data_after_billing_address', function($order) {
  $source = get_post_meta($order->get_id(), '_order_attribution_source', true);
  $medium = get_post_meta($order->get_id(), '_order_attribution_medium', true);
  $campaign = get_post_meta($order->get_id(), '_order_attribution_campaign', true);
  $channel = get_post_meta($order->get_id(), '_order_ga4_channel', true);

  if ($source) {
    echo '<h3 style="margin-top: 20px; border-top: 1px solid #ddd; padding-top: 12px;">Traffic Attribution</h3>';
    if ($channel) {
      echo '<p><strong>GA4 Channel:</strong> ' . esc_html($channel) . '</p>';
    }
    echo '<p><strong>Source:</strong> ' . esc_html($source) . '</p>';
    if ($medium) echo '<p><strong>Medium:</strong> ' . esc_html($medium) . '</p>';
    if ($campaign) echo '<p><strong>Campaign:</strong> ' . esc_html($campaign) . '</p>';
  }
});

// Add column to orders list
add_filter('manage_edit-shop_order_columns', function($columns) {
  $columns['attribution'] = 'Traffic Source';
  return $columns;
}, 20);

add_action('manage_shop_order_posts_custom_column', function($column, $post_id) {
  if ($column === 'attribution') {
    $source = get_post_meta($post_id, '_order_attribution_source', true);
    $channel = get_post_meta($post_id, '_order_ga4_channel', true);

    if ($source) {
      echo '<strong>' . esc_html($source) . '</strong>';
      if ($channel) {
        echo '<br><small>(' . esc_html($channel) . ')</small>';
      }
    } else {
      echo '-';
    }
  }
}, 10, 2);
