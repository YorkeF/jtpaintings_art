export default function ImageGrid({ images, onOpen }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {images.map((img, i) => (
        <button
          key={img.id}
          onClick={() => onOpen(i)}
          className="group aspect-square overflow-hidden rounded-lg bg-gray-200 shadow hover:shadow-md transition-shadow"
        >
          <img
            src={img.image_path}
            alt={img.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </button>
      ))}
    </div>
  )
}
