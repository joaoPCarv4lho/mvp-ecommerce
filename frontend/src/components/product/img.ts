export interface ProductImgProps {
  src: string;
  srcSet: string;
  width: 400;
  height: 400;
}

/** Derives the -800 variant from a product's -400.webp src and builds a srcSet pair. */
export function productImgProps(src: string): ProductImgProps {
  const src800 = src.replace('-400.webp', '-800.webp');
  return {
    src,
    srcSet: `${src} 400w, ${src800} 800w`,
    width: 400,
    height: 400,
  };
}
