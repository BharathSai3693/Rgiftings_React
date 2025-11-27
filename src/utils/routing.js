const allowedPages = ['shop', 'products', 'attributes', 'cart', 'orders'];

export const parseHashRoute = () => {
  const cleaned = window.location.hash.replace('#', '').replace(/^\//, '');
  const [pageSegment, idSegment, actionSegment] = cleaned.split('/').filter(Boolean);
  const page = allowedPages.includes(pageSegment) ? pageSegment : 'shop';
  return { page, id: idSegment || null, action: actionSegment || null };
};
