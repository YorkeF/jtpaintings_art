import { useState } from 'react'
import AddImageForm from './AddImageForm.jsx'
import ImageRow from './ImageRow.jsx'

export default function ImageTable({ title, images, sections, onChanged }) {
  const [showAddImage, setShowAddImage] = useState(false)

  return (
    <section className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-800 flex-1">{title}</h2>
        <button
          onClick={() => setShowAddImage((v) => !v)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showAddImage ? 'Cancel add' : '+ Add image'}
        </button>
      </div>

      {showAddImage && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <AddImageForm
            sectionId=""
            onAdded={() => { setShowAddImage(false); onChanged() }}
          />
        </div>
      )}

      {images.length > 0 ? (
        <ul className="divide-y divide-gray-100">
          {images.map((img) => (
            <ImageRow key={img.id} image={img} sections={sections} onChanged={onChanged} />
          ))}
        </ul>
      ) : (
        !showAddImage && (
          <p className="px-6 py-4 text-sm text-gray-400">No unsectioned images.</p>
        )
      )}
    </section>
  )
}
