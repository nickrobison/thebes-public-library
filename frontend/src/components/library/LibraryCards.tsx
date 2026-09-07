import { LibraryItem } from '../../types/library'

export function LibraryCards({ data }: { data: LibraryItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((item) => (
        <div key={item.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
          <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
          <p className="text-sm text-muted-foreground mb-1">Authors: {item.authors}</p>
          <p className="text-sm text-muted-foreground mb-1">Published: {item.pubYear}</p>
          <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
            {item.status}
          </span>
        </div>
      ))}
    </div>
  )
}
