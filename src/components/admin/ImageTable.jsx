import ImageRow from './ImageRow.jsx'

export default function ImageTable({ title, images, sections, onChanged }) {
  return (
    <section className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      <ul className="divide-y divide-gray-100">
        {images.map((img) => (
          <ImageRow key={img.id} image={img} sections={sections} onChanged={onChanged} />
        ))}
      </ul>
    </section>
  )
}
