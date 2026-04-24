export default function Tooltip({ text }) {
  return (
    <span className="relative group inline-flex items-center cursor-default select-none">
      <span className="w-3.5 h-3.5 rounded-full bg-gray-200 text-gray-500 text-[9px] font-bold inline-flex items-center justify-center leading-none hover:bg-gray-300 transition-colors">
        ?
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded bg-gray-800 px-2.5 py-2 text-xs text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 leading-relaxed whitespace-normal">
        {text}
      </span>
    </span>
  )
}
