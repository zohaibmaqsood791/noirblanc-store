<?php
/**
 * FIXED WordPress Order Attribution Setup
 * Replace the old WORDPRESS_ATTRIBUTION_SETUP.php with this code
 */

// Add custom column to WooCommerce orders list (HPOS compatible)
add_filter('woocommerce_admin_order_list_columns', function($columns) {
  $columns['order_attribution'] = 'Traffic Source';
  return $columns;
});

// Display attribution in order list
add_action('woocommerce_admin_order_list_column_order_attribution', function($order) {
  $attribution = get_post_meta($order->get_id(), '_order_attribution', true);
  $medium = get_post_meta($order->get_id(), '_order_attribution_medium', true);

  if ($attribution) {
    echo '<strong>' . esc_html($attribution) . '</strong>';
    if ($medium) {
      echo '<br><small>' . esc_html($medium) . '</small>';
    }
  } else {
    echo '<span style="color: #999;">-</span>';
  }
});

// Display attribution in order details page
add_action('woocommerce_admin_order_data_after_order_details', function($order) {
  $attribution = get_post_meta($order->get_id(), '_order_attribution', true);
  $medium = get_post_meta($order->get_id(), '_order_attribution_medium', true);
  $campaign = get_post_meta($order->get_id(), '_order_attribution_campaign', true);

  if ($attribution) {
    ?>
    <div class="order-data-column" style="margin-top: 20px; padding: 12px; border: 1px solid #ddd; border-radius: 3px; background: #f9f9f9;">
      <h4>Traffic Attribution</h4>
      <p>
        <strong>Source:</strong> <?php echo esc_html($attribution); ?><br>
        <?php if ($medium): ?>
          <strong>Medium:</strong> <?php echo esc_html($medium); ?><br>
        <?php endif; ?>
        <?php if ($campaign): ?>
          <strong>Campaign:</strong> <?php echo esc_html($campaign); ?>
        <?php endif; ?>
      </p>
    </div>
    <?php
  }
});

// Store attribution when order is created
add_action('woocommerce_new_order', function($order_id, $order) {
  global $wpdb;
  $logs_table = $wpdb->prefix . 'debug_logs';

  $customer_email = $order->get_billing_email();

  // Find the last attribution_captured log for this email
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
      update_post_meta($order_id, '_order_attribution', sanitize_text_field($data['source']));
      if (!empty($data['medium'])) {
        update_post_meta($order_id, '_order_attribution_medium', sanitize_text_field($data['medium']));
      }
      if (!empty($data['campaign'])) {
        update_post_meta($order_id, '_order_attribution_campaign', sanitize_text_field($data['campaign']));
      }
    }
  }
}, 10, 2);
