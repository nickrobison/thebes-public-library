import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLibrary } from '../hooks/useLibrary'
import { LibraryTable } from '../components/library/LibraryTable'
import { LibraryCards } from '../components/library/LibraryCards'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileUp, Grid, List } from 'lucide-react'
export default function LibraryRoute() {
  const [view, setView] = useState<'table' | 'cards'>('table')
  const [sortBy, setSortBy] = useState('title')
  const [importOpen, setImportOpen] = useState(false)

  const { data: libraryData, isLoading, error } = useLibrary()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Library</h1>
        <div className="flex gap-4">
          <div className="flex border rounded-lg p-1">
            <Button
              variant={view === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('table')}
              className="px-3"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('cards')}
              className="px-3"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="authors">Authors</SelectItem>
              <SelectItem value="pubYear">Publication Year</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button>
                <FileUp className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Library Items</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file">File</Label>
                  <Input id="file" type="file" />
                </div>
                <Button onClick={() => setImportOpen(false)}>Import</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {view === 'table' ? (
        <LibraryTable data={libraryData || []} />
      ) : (
        <LibraryCards data={libraryData || []} />
      )}
    </div>
  )
}
