import { useEffect, useState } from "react"
import Upload from "./components/Upload"
import FilterBlock from "./components/FilterBlock"
import Columns from "./components/Columns"
import TableView from "./components/TableView"
import Download from "./components/Download"
import Chart from "./components/Chart"
import UserQuery from "./components/UserQuery"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./components/ui/resizable"
import { initDb, AsyncDuckDB } from "./lib/duckdb"
import { Button } from "./components/ui/button"
import { Cell, CellType } from "./lib/utils"
import PivotTable from "./components/Pivot"
import CreateColumn from "./components/CreateColumn"
import AI from "./components/AI"
import Feedback from "./components/Feedback"
import { POSTHOG_PUBLIC_KEY, POSTHOG_URL } from "./lib/config"
import Sort from "./components/Sort"
import RemoveDuplicate from "./components/RemoveDuplicate"
import Python from "./components/Python"

const addCell = (
  type: CellType,
  setCells: React.Dispatch<React.SetStateAction<Cell[]>>
) => {
  setCells((prevCells) => [...prevCells, { type }])
}

const updateQueryFactory = (
  i: number,
  cell: Cell,
  setCells: React.Dispatch<React.SetStateAction<Cell[]>>
) => {
  return (q: string) => {
    setCells((prev) => [
      ...prev.slice(0, i),
      { ...cell, query: q },
      ...prev.slice(i + 1),
    ])
  }
}
export default function App() {
  const [db, setDb] = useState<AsyncDuckDB | null>(null)
  const [cells, setCells] = useState<Cell[]>([{ type: "upload" }])
  const [worker, setWorker] = useState<any>(null)

  useEffect(() => {
    const initDbAsync = async () => {
      const db = await initDb()
      const con = await db.connect()
      con.query("SET pivot_limit=1000001")
      setDb(db)
    }
    initDbAsync()
    const w = new Worker(
      //eslint-disable-next-line unicorn/relative-url-style
      new URL("./core/worker.ts", import.meta.url),
      {
        type: "module",
      }
    )
    setWorker(w)
  }, [])

  return (
    <ResizablePanelGroup direction="horizontal" className="rounded-lg border">
      <ResizablePanel
        key={1234}
        defaultSize={50}
        className="pr-4"
        style={{
          display: "flex",
          flexDirection: "column",
          paddingRight: "16px",
          paddingLeft: "16px",
        }}
      >
        <div className="h-screen overflow-y-auto">
          <div className="flex flex-col items-center justify-center w-full">
            {POSTHOG_PUBLIC_KEY && POSTHOG_URL && <Feedback />}
            {cells?.map((cell, i) => {
              if (cell.type === "upload") {
                return (
                  <Upload
                    key={i}
                    db={db}
                    updateQuery={updateQueryFactory(i, cell, setCells)}
                    cell={cell}
                    setCells={setCells}
                  />
                )
              } else if (cell.type === "filter") {
                return (
                  <FilterBlock
                    key={i}
                    db={db}
                    updateQuery={updateQueryFactory(i, cell, setCells)}
                    prevQuery={cells[i - 1].query as string}
                  />
                )
              } else if (cell.type === "pivot") {
                return (
                  <PivotTable
                    key={i}
                    db={db}
                    updateQuery={updateQueryFactory(i, cell, setCells)}
                    prevQuery={cells[i - 1].query as string}
                  />
                )
              } else if (cell.type === "userquery") {
                return (
                  <UserQuery
                    key={i}
                    db={db}
                    updateQuery={updateQueryFactory(i, cell, setCells)}
                    prevQuery={cells[i - 1].query as string}
                  />
                )
              } else if (cell.type === "table") {
                return (
                  <div className="mb-4 flex max-h-[25vh] max-w-full items-start justify-center overflow-y-scroll rounded-lg border">
                    <TableView
                      key={i}
                      db={db}
                      updateQuery={updateQueryFactory(i, cell, setCells)}
                      prevQuery={cells[i - 1].query as string}
                      rowAmount={100}
                    />
                  </div>
                )
              } else if (cell.type === "columns") {
                return (
                  <Columns
                    key={i}
                    db={db}
                    updateQuery={updateQueryFactory(i, cell, setCells)}
                    prevQuery={cells[i - 1].query as string}
                  />
                )
              } else if (cell.type === "derive") {
                return (
                  <CreateColumn
                    key={i}
                    db={db}
                    updateQuery={updateQueryFactory(i, cell, setCells)}
                    prevQuery={cells[i - 1].query as string}
                  />
                )
              } else if (cell.type === "download") {
                return (
                  <Download
                    key={i}
                    db={db}
                    prevQuery={cells[i - 1].query as string}
                  />
                )
              } else if (cell.type === "sort") {
                return (
                  <Sort
                    key={i}
                    db={db}
                    updateQuery={updateQueryFactory(i, cell, setCells)}
                    prevQuery={cells[i - 1].query as string}
                  />
                )
              }
                 else if (cell.type === "removeDuplicate") {
                return (
                   <RemoveDuplicate
                    key={i}
                    db={db}
                    updateQuery={updateQueryFactory(i, cell, setCells)}
                    prevQuery={cells[i - 1].query as string}
                    onDelete={() => setCells(cells.filter((_, index) => index !== i))}
                  />
                )
              }
              else if (cell.type === "chart") {
                return (
                  <Chart
                    key={i}
                    db={db}
                    updateQuery={updateQueryFactory(i, cell, setCells)}
                    prevQuery={cells[i - 1].query as string}
                  />
                )
              } else if (cell.type === "AI") {
                return (
                  <AI
                    key={i}
                    db={db}
                    updateQuery={updateQueryFactory(i, cell, setCells)}
                    prevQuery={cells[i - 1].query as string}
                  />
                )
              } else if (cell.type === "python") {
                return (
                  <Python
                    key={i}
                    db={db}
                    updateQuery={updateQueryFactory(i, cell, setCells)}
                    prevQuery={cells[i - 1].query as string}
                    worker={worker}
                  />
                )
              }
              return null
            })}
            <div className="flex items-center flex-wrap max-w-full">
              {cells[cells.length - 1].query && (
                <>
                  <Button
                    onClick={() => addCell("filter", setCells)}
                    className="ml-2 mb-2"
                  >
                    Filter
                  </Button>
                  <Button
                    onClick={() => addCell("AI", setCells)}
                    className="ml-2 mb-2"
                  >
                    Ask AI
                  </Button>
                  <Button
                    onClick={() => addCell("python", setCells)}
                    className="ml-2 mb-2"
                  >
                    Python
                  </Button>
                  <Button
                    onClick={() => addCell("pivot", setCells)}
                    className="ml-2 mb-2"
                  >
                    Pivot
                  </Button>
                  <Button
                    onClick={() => addCell("userquery", setCells)}
                    className="ml-2 mb-2"
                  >
                    SQL / PRQL
                  </Button>
                  <Button
                    onClick={() => addCell("chart", setCells)}
                    className="ml-2 mb-2"
                  >
                    Chart
                  </Button>
                  <Button
                    onClick={() => addCell("derive", setCells)}
                    className="ml-2 mb-2"
                  >
                    Create column
                  </Button>
                  <Button
                    onClick={() => addCell("columns", setCells)}
                    className="ml-2 mb-2"
                  >
                    Remove columns
                  </Button>
                  <Button
                    onClick={() => addCell("sort", setCells)}
                    className="ml-2 mb-2"
                  >
                    Sort
                  </Button>
                  <Button
                    onClick={() => addCell("removeDuplicate", setCells)}
                    className="ml-2 mb-2"
                  >
                    Remove Duplicates
                  </Button>
                  <Button
                    onClick={() => addCell("table", setCells)}
                    className="ml-2 mb-2"
                  >
                    Table
                  </Button>
                  <Button
                    onClick={() => addCell("download", setCells)}
                    className="ml-2 mb-2 bg-blue-500 hover:bg-blue-600"
                  >
                    Download
                  </Button>
                </>
              )}
              {cells.length > 1 && (
                <Button
                  onClick={() => setCells(cells.slice(0, -1))}
                  className="ml-2 mb-2 bg-red-500 hover:bg-red-600"
                >
                  Delete last block
                </Button>
              )}
            </div>
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel key={456}>
        <TableView
          key="placeholder123"
          db={db}
          updateQuery={() => {}}
          prevQuery={cells[cells.length - 1].query as string}
          rowAmount={10000}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
