
const NewsCard = ({ title, excerpt, source, date, image, link }) => (
  <article className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
    {image && (
      <div className="aspect-video w-full overflow-hidden bg-blush">
        <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]" />
      </div>
    )}
    <div className="p-6 flex flex-col gap-3 flex-1">
      <div className="flex items-center justify-between text-xs text-muted">
        {source && <span className="font-medium">{source}</span>}
        {date && <time>{date}</time>}
      </div>
      <h3 className="text-base md:text-lg font-semibold text-charcoal leading-tight">{title}</h3>
      {excerpt && <p className="text-sm text-muted line-clamp-3">{excerpt}</p>}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto text-sm font-semibold text-burgundy-wine hover:text-burgundy-deep"
        >
          Read more →
        </a>
      )}
    </div>
  </article>
);

export default NewsCard;
