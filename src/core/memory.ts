/**
 * Phones kill tabs that hold too many decoded pictures (the page then reloads — to the visitor it looked like
 * "it jumped back to the intro"). On touch screens every picture is therefore loaded only while it is near the
 * viewport and released again once it is far away. Desktop keeps its eager prefetch.
 */
let loader: IntersectionObserver | null = null;
let releaser: IntersectionObserver | null = null;

export function windowImages(root: HTMLElement): void {
  loader?.disconnect();
  releaser?.disconnect();
  // load a bit before a picture arrives…
  loader = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const img = e.target as HTMLImageElement;
        const src = img.dataset.src;
        if (src && !img.getAttribute('src')) img.src = src;
      }
    },
    { rootMargin: '110% 0px 110% 0px' },
  );
  // …and let it go once it is several screens away
  releaser = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) continue;
        const img = e.target as HTMLImageElement;
        if (img.dataset.src && img.getAttribute('src')) img.removeAttribute('src');
      }
    },
    { rootMargin: '230% 0px 230% 0px' },
  );
  root.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    if (img.closest('.hero')) return; // the first screen is always ready
    const src = img.getAttribute('src');
    if (!src) return;
    img.dataset.src = src;
    img.removeAttribute('src');
    img.loading = 'eager';
    loader!.observe(img);
    releaser!.observe(img);
  });
}

export function stopWindowing(): void {
  loader?.disconnect();
  releaser?.disconnect();
  loader = releaser = null;
}
