<?php
/**
 * GA4 Purchase Event Tracking for WooCommerce
 * Fires purchase event to GA4 when order is completed
 * Add to functions.php
 */

// Send purchase event to GA4 when order is completed
add_action('woocommerce_order_status_completed', function($order_id) {
  $order = wc_get_order($order_id);
  if (!$order) return;

  $ga4_id = 'GT-PHCH4QPC'; // Your GA4 Measurement ID
  $currency = $order->get_currency();
  $total = $order->get_total();
  $items = [];

  // Build items array
  foreach ($order->get_items() as $item) {
    $product = $item->get_product();
    $items[] = [
      'item_id' => $product->get_id(),
      'item_name' => $item->get_name(),
      'price' => (float) $item->get_total() / $item->get_quantity(),
      'quantity' => $item->get_quantity()
    ];
  }

  // Create the gtag script to fire purchase event
  $script = sprintf(
    "gtag('event', 'purchase', {
      'transaction_id': '%s',
      'affiliation': 'NoirBlanc Store',
      'value': %f,
      'currency': '%s',
      'items': %s
    });",
    esc_js($order->get_order_number()),
    $total,
    $currency,
    json_encode($items)
  );

  // Save to order meta for later insertion in frontend
  update_post_meta($order_id, '_ga4_purchase_script', $script);
});

// Inject GA4 purchase script in order confirmation page
add_action('woocommerce_thankyou', function($order_id) {
  $script = get_post_meta($order_id, '_ga4_purchase_script', true);

  if ($script) {
    echo '<script>' . $script . '</script>';
  }
}, 5);

// Also send via admin when manually marking order as completed
add_action('woocommerce_order_status_changed', function($order_id, $old_status, $new_status) {
  if ($new_status === 'completed') {
    $script = get_post_meta($order_id, '_ga4_purchase_script', true);

    if (!$script) {
      $order = wc_get_order($order_id);
      if (!$order) return;

      $ga4_id = 'GT-PHCH4QPC';
      $currency = $order->get_currency();
      $total = $order->get_total();
      $items = [];

      foreach ($order->get_items() as $item) {
        $product = $item->get_product();
        $items[] = [
          'item_id' => $product->get_id(),
          'item_name' => $item->get_name(),
          'price' => (float) $item->get_total() / $item->get_quantity(),
          'quantity' => $item->get_quantity()
        ];
      }

      $script = sprintf(
        "gtag('event', 'purchase', {
          'transaction_id': '%s',
          'affiliation': 'NoirBlanc Store',
          'value': %f,
          'currency': '%s',
          'items': %s
        });",
        esc_js($order->get_order_number()),
        $total,
        $currency,
        json_encode($items)
      );

      update_post_meta($order_id, '_ga4_purchase_script', $script);
    }
  }
}, 10, 3);
