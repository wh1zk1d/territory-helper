import * as React from 'react'
import { useFormField } from './hooks/useFormField'
import { Helmet } from 'react-helmet'
import { PeopleIcon, TrashIcon } from '@primer/octicons-react'
import slugify from 'slugify'
import * as FileSaver from 'file-saver'
import * as xlsx from 'xlsx'

type Street = {
  name: string
  numbers: string[]
}

type StreetBlockProps = {
  street: Street
  onAddVariant: (street: string, number: string) => void
  onDelete: (street: string, number: string) => void
}

type HouseProps = {
  number: string
  onAdd: (number: string) => void
  onRemove: (number: string) => void
}

const Label = (props: any) => (
  <label className='block my-2 text-sm' {...props}>
    {props.children}
  </label>
)

const House = ({ number, onAdd, onRemove }: HouseProps) => {
  const [hasVariant, setHasVariant] = React.useState(false)

  return (
    <div className='py-4 px-8 bg-gray-100 rounded-md flex flex-col items-center justify-center'>
      <span className='font-semibold'>{number}</span>
      <div className='text-gray-800 flex space-x-4 mt-2 opacity-30 hover:opacity-100'>
        {!hasVariant && number.slice(-1) !== 'c' && (
          <button
            onClick={() => {
              onAdd(number)
              setHasVariant(true)
            }}
          >
            <PeopleIcon size={16} />
          </button>
        )}
        <button onClick={() => onRemove(number)}>
          <TrashIcon size={16} />
        </button>
      </div>
    </div>
  )
}

const StreetBlock = ({ street, onAddVariant, onDelete }: StreetBlockProps) => {
  function onAdd(number: string) {
    onAddVariant(street.name, number)
  }

  function onRemove(number: string) {
    onDelete(street.name, number)
  }

  return (
    <div className='my-8'>
      <h4 className='font-bold text-gray-900'>{street.name}</h4>
      <div className='grid grid-cols-6 gap-4 mt-4'>
        {street.numbers.map(number => (
          <House key={number} number={number} onAdd={onAdd} onRemove={onRemove} />
        ))}
      </div>
    </div>
  )
}

export default function App() {
  // Constants
  const territoryName = useFormField()
  const [streets, setStreets] = React.useState<Street[]>([])

  // Reused state
  const streetname = useFormField()
  const numbers = useFormField()

  // Logic
  function addNumberVariant(street: string, number: string) {
    const streetsCopy = [...streets]
    let s = streetsCopy.find(s => s.name === street)
    if (s) {
      const addons = ['a', 'b', 'c']

      const indexOfNumber = s.numbers.indexOf(number)
      let newNumbers
      if (addons.indexOf(number.slice(-1)) === -1) {
        newNumbers = [
          ...s.numbers.slice(0, indexOfNumber + 1),
          `${number}a`,
          ...s.numbers.slice(indexOfNumber + 1),
        ]
      } else {
        const letter = addons[addons.indexOf(number.slice(-1)) + 1]
        if (letter) {
          newNumbers = [
            ...s.numbers.slice(0, indexOfNumber + 1),
            `${number.substr(0, number.length - 1)}${letter}`,
            ...s.numbers.slice(indexOfNumber + 1),
          ]
        }
      }
      if (newNumbers) {
        s.numbers = newNumbers
      }
      setStreets(streetsCopy)
    }
  }

  function deleteNumber(street: string, number: string) {
    const streetsCopy = [...streets]
    let s = streetsCopy.find(s => s.name === street)
    if (s) {
      s.numbers = s.numbers.filter(n => n !== number)
      setStreets(streetsCopy)
    }
  }

  function exportCSV() {
    // Get longest street
    const maxHouses = Math.max(...streets.map(s => s.numbers.length), 0)

    // Create CSV headers
    const headers = streets.map(s => s.name)
    let csvData: string[][] = [headers]
    for (let i = 0; i < maxHouses; i++) {
      const entries = streets.map(street => street.numbers[i] || '')
      csvData = [...csvData, entries]
    }

    // Export to Excel file
    const fileType =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    const fileExtension = '.xlsx'
    const filename = slugify(territoryName.value, { lower: true })

    const ws = xlsx.utils.json_to_sheet(csvData, { skipHeader: true })
    const wb = { Sheets: { data: ws }, SheetNames: ['data'] }
    const excelBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'array' })
    const data = new Blob([excelBuffer], { type: fileType })
    FileSaver.saveAs(data, filename + fileExtension)
  }

  // Event handler
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    let houses: string[] = []
    for (let i = 1; i <= Number(numbers.value); i++) {
      houses = [...houses, i.toString()]
    }

    const street: Street = {
      name: streetname.value as string,
      numbers: houses,
    }

    setStreets(streets => [...streets, street])

    // Reset the fields
    streetname.reset()
    numbers.reset()
  }

  return (
    <div className='container max-w-screen2xl mx-auto antialiased'>
      <Helmet>
        <title>Territory Helper</title>
      </Helmet>
      <h1 className='py-12 font-bold text-md'>
        <span role='img' aria-label='map emoji' className='pr-2'>
          🗺
        </span>{' '}
        Territory Helper
      </h1>

      <div className='flex space-x-32'>
        <div>
          <Label htmlFor='territory-name'>Gebietsname</Label>
          <input type='text' id='territory-name' {...territoryName.bind} />

          <h2 className='font-bold mt-8 mb-4'>Straßen</h2>
          <form onSubmit={handleSubmit} autoComplete='off' id='form'>
            <Label htmlFor='street'>Straße</Label>
            <input type='text' id='street' {...streetname.bind} required className='mb-4' />

            <Label htmlFor='numbers'>Hausnummern</Label>
            <input type='number' id='numbers' {...numbers.bind} required />

            <button
              type='submit'
              className='block mt-10 bg-green-600 text-white px-4 py-2 font-medium rounded hover:bg-green-700'
            >
              Hinzufügen
            </button>
          </form>
        </div>

        <div>
          <h3 className='text-lg font-bold'>{territoryName.value}</h3>
          {streets.map((street, i) => (
            <StreetBlock
              key={i}
              street={street}
              onAddVariant={addNumberVariant}
              onDelete={deleteNumber}
            />
          ))}
          <div className='flex space-x-4 my-10'>
            {streets.length > 0 && (
              <button
                className='block bg-blue-500 text-white px-4 py-2 font-medium rounded hover:bg-blue-600'
                onClick={exportCSV}
              >
                Zu Excel exportieren
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
