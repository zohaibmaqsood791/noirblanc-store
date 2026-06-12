"use client";

import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const secondImage = product.galleryImages?.nodes?.[0];

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      {/* padding-bottom trick: creates a 3:4 box that fill images can fill */}
      <div className="relative w-full overflow-hidden rounded mb-3 bg-neutral-50" style={{ paddingBottom: "133.33%", height: 0 }}>
        {product.image ? (
          <>
            <Image
              src={product.image.sourceUrl}
              alt={product.image.altText || product.name}
              fill
              className={`object-cover transition-opacity duration-500 ${secondImage ? "group-hover:opacity-0" : ""}`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {secondImage && (
              <Image
                src={secondImage.sourceUrl}
                alt={secondImage.altText || product.name}
                fill
                className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 bg-neutral-100" />
        )}

        {product.onSale && (
          <span className="absolute top-2 left-2 bg-black text-white text-[10px] font-medium px-2 py-0.5 tracking-wide z-10">
            SALE
          </span>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-neutral-900 group-hover:text-black truncate">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          {product.onSale && product.salePrice ? (
            <>
              <span className="text-sm font-semibold text-black">{formatPrice(product.salePrice)}</span>
              <span className="text-xs text-neutral-400 line-through">{formatPrice(product.regularPrice)}</span>
            </>
          ) : (
            <span className="text-sm font-semibold text-black">{formatPrice(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
