---
trigger: always_on
---

COMMON MISTAKES
---------------

Using useState in Server Component:
  Bad:
    export default async function Page() {
      const [state, setState] = useState() // ERROR!
      const data = await fetchData()
      return <div>{data}</div>
    }
  
  Good:
    'use client'
    export default function Page() {
      const [state, setState] = useState()
      return <div>{state}</div>
    }

Fetching data in Client Component:
  Bad:
    'use client'
    export default function Page() {
      const [data, setData] = useState()

      useEffect(() => {
        fetchData().then(setData)
      }, [])
      
      return <div>{data}</div>
    }
  
  Good (use Server Component):
    export default async function Page() {
      const data = await fetchData()
      return <div>{data}</div>
    }

Not handling loading states:
  Bad:
    async function handleSubmit() {
      await apiCall()
    }
  
  Good:
    const [loading, setLoading] = useState(false)

    async function handleSubmit() {
      setLoading(true)
      try {
        await apiCall()
      } finally {
        setLoading(false)
      }
    }

Missing error handling:
  Bad:
    const data = await fetchData()
  
  Good:
    const { data, error } = await fetchData()
    if (error) {
      // Handle error
    }
