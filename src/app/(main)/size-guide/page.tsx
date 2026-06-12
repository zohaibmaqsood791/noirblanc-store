export default function SizeGuidePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#FAFAFA] border-b border-neutral-100 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4">Size Guide</h1>
          <p className="text-neutral-500 text-lg">
            Find the perfect fit. All dimensions are in inches unless noted.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-16 space-y-14">

        {/* Crossbody Bags */}
        <div>
          <h2 className="font-heading text-2xl font-bold mb-2">Crossbody Bags</h2>
          <p className="text-sm text-neutral-500 mb-5">
            Dimensions are W × H × D. Strap drop is measured from the top of the bag to the bottom of the strap when worn.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA]">
                  <th className="text-left font-semibold py-3 px-4 rounded-tl-xl">Size</th>
                  <th className="text-left font-semibold py-3 px-4">Dimensions (in)</th>
                  <th className="text-left font-semibold py-3 px-4">Strap Drop</th>
                  <th className="text-left font-semibold py-3 px-4 rounded-tr-xl">Best For</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-100">
                  <td className="py-3 px-4 font-medium">Mini</td>
                  <td className="py-3 px-4 text-neutral-500">7&quot; × 5&quot; × 2&quot;</td>
                  <td className="py-3 px-4 text-neutral-500">22–24&quot;</td>
                  <td className="py-3 px-4 text-neutral-500">Essentials only — phone, cards, keys</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="py-3 px-4 font-medium">Small</td>
                  <td className="py-3 px-4 text-neutral-500">9&quot; × 6.5&quot; × 2.5&quot;</td>
                  <td className="py-3 px-4 text-neutral-500">22–26&quot;</td>
                  <td className="py-3 px-4 text-neutral-500">Everyday use, slim wallet, small items</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="py-3 px-4 font-medium">Medium</td>
                  <td className="py-3 px-4 text-neutral-500">11&quot; × 8&quot; × 3&quot;</td>
                  <td className="py-3 px-4 text-neutral-500">24–28&quot;</td>
                  <td className="py-3 px-4 text-neutral-500">Tablet, notebook, daily carry</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Large</td>
                  <td className="py-3 px-4 text-neutral-500">13&quot; × 10&quot; × 4&quot;</td>
                  <td className="py-3 px-4 text-neutral-500">24–30&quot;</td>
                  <td className="py-3 px-4 text-neutral-500">Work bag, laptop (13&quot;), full-day carry</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Wallets */}
        <div>
          <h2 className="font-heading text-2xl font-bold mb-2">Wallets</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA]">
                  <th className="text-left font-semibold py-3 px-4 rounded-tl-xl">Style</th>
                  <th className="text-left font-semibold py-3 px-4">Dimensions (in)</th>
                  <th className="text-left font-semibold py-3 px-4">Card Slots</th>
                  <th className="text-left font-semibold py-3 px-4 rounded-tr-xl">Features</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-100">
                  <td className="py-3 px-4 font-medium">Card Holder</td>
                  <td className="py-3 px-4 text-neutral-500">4&quot; × 3&quot; × 0.3&quot;</td>
                  <td className="py-3 px-4 text-neutral-500">4–6 slots</td>
                  <td className="py-3 px-4 text-neutral-500">Slim, front pocket use</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="py-3 px-4 font-medium">Bifold</td>
                  <td className="py-3 px-4 text-neutral-500">4.5&quot; × 3.5&quot; × 0.5&quot;</td>
                  <td className="py-3 px-4 text-neutral-500">8–10 slots</td>
                  <td className="py-3 px-4 text-neutral-500">Bill compartment, coin pocket</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Zip Around</td>
                  <td className="py-3 px-4 text-neutral-500">7.5&quot; × 4&quot; × 1&quot;</td>
                  <td className="py-3 px-4 text-neutral-500">12+ slots</td>
                  <td className="py-3 px-4 text-neutral-500">Full-size bills, coins, phone pocket</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bag Straps */}
        <div>
          <h2 className="font-heading text-2xl font-bold mb-2">Bag Straps</h2>
          <p className="text-sm text-neutral-500 mb-5">
            All straps are adjustable. Min and max lengths listed below.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA]">
                  <th className="text-left font-semibold py-3 px-4 rounded-tl-xl">Strap Type</th>
                  <th className="text-left font-semibold py-3 px-4">Width</th>
                  <th className="text-left font-semibold py-3 px-4">Min Length</th>
                  <th className="text-left font-semibold py-3 px-4 rounded-tr-xl">Max Length</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-100">
                  <td className="py-3 px-4 font-medium">Thin Chain</td>
                  <td className="py-3 px-4 text-neutral-500">0.25&quot;</td>
                  <td className="py-3 px-4 text-neutral-500">20&quot;</td>
                  <td className="py-3 px-4 text-neutral-500">48&quot;</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="py-3 px-4 font-medium">Classic Leather</td>
                  <td className="py-3 px-4 text-neutral-500">0.75&quot;</td>
                  <td className="py-3 px-4 text-neutral-500">22&quot;</td>
                  <td className="py-3 px-4 text-neutral-500">52&quot;</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium">Wide Shoulder</td>
                  <td className="py-3 px-4 text-neutral-500">1.5&quot;</td>
                  <td className="py-3 px-4 text-neutral-500">24&quot;</td>
                  <td className="py-3 px-4 text-neutral-500">56&quot;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Fit tip */}
        <div className="bg-[#FAFAFA] rounded-2xl p-8">
          <h3 className="font-heading text-lg font-semibold mb-3">How to Measure</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-neutral-600">
            <div>
              <p className="font-medium text-black mb-1">Bag Dimensions</p>
              <p>Measure at the widest point. Width (W) is measured side to side, Height (H) from top to bottom, and Depth (D) from front to back.</p>
            </div>
            <div>
              <p className="font-medium text-black mb-1">Strap Drop</p>
              <p>The strap drop is measured from the top of the bag opening to the lowest point of the strap when worn on the shoulder. A longer drop sits lower on your body.</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-neutral-500 mb-4">Not sure which size is right for you?</p>
          <a
            href="/contact"
            className="inline-block bg-black text-white text-sm font-semibold px-8 py-3 rounded-xl hover:bg-neutral-800 transition-colors tracking-wide"
          >
            Ask Us
          </a>
        </div>
      </section>
    </main>
  );
}
