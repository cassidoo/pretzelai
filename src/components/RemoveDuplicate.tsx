import React, { useState, useEffect } from "react";
import { AsyncDuckDB } from "../lib/duckdb";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "./ui/select";
import Block from "./ui/Block";
import { query, mergeQueries, removeQuery } from "../lib/utils";
import { Button } from "./ui/button";

interface DuplicateProps {
  db: AsyncDuckDB | null;
  updateQuery: (q: string) => void;
  prevQuery: string;
  onDelete: () => void; // Function to handle block deletion
}

export default function RemoveDuplicateBlock({
  db,
  updateQuery,
  prevQuery,
  onDelete,
}: DuplicateProps) {
  const [fields, setFields] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>("Full Rows");
  const [tableRows, setTableRows] = useState<number>(0);
  const [currentTableRows, setCurrentTableRows] = useState<number>(0);
  const [numDuplicatesRemoved, setNumDuplicatesRemoved] = useState<number>(0);
  const [pendingColumn, setPendingColumn] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false); // Loading state

  useEffect(() => {
    const fetchFields = async () => {
      if (db && prevQuery) {
        setLoading(true); // Set loading to true when fetching data
        const { rowsJson } = await query(db, mergeQueries(prevQuery, ""));
        if (rowsJson?.[0]) {
          setFields(["Full Rows", ...Object.keys(rowsJson[0])]);
          setTableRows(rowsJson.length);
        }
        setLoading(false); // Set loading to false after data is fetched
      }
    };

    fetchFields(); // Initial fetch on component mount and whenever prevQuery changes
  }, [db, prevQuery, setTableRows]);

  useEffect(() => {
    // Automatically remove duplicates on mount with the default option "Full Rows"
    if (selectedColumn === "Full Rows") {
      setPendingColumn(selectedColumn);
    }
  }, [selectedColumn, prevQuery]);

  useEffect(() => {
    // Avoid executing on initial render and when there's no pending column
    if (pendingColumn !== "" && db && prevQuery && fields.length > 0) {
      handleRemoveDuplicates();
    }
  }, [pendingColumn, db, prevQuery, fields]);

  const handleRemoveDuplicates = async () => {
    const removeDuplicateQuery = removeQuery(pendingColumn, fields);
    const q = mergeQueries(prevQuery, removeDuplicateQuery);
    updateQuery(q); // Update the query asynchronously
    setLoading(true); // Set loading to true during asynchronous operation
    const result = await query(db, q);
    setLoading(false); // Set loading to false after asynchronous operation is complete
    if (result.rowsJson && result.rowsJson.length > 0) {
      const numRemoved = result.rowsJson.length;
      setCurrentTableRows(numRemoved);
      setNumDuplicatesRemoved(tableRows - numRemoved);
    } else if (result.rowsJson.length === 0) {
      setTableRows(0);
      setCurrentTableRows(0);
      setNumDuplicatesRemoved(0);
    }
    setPendingColumn("");
  };

  const handleColumnChange = (value: string) => {
    setSelectedColumn(value);
    setPendingColumn(value);
  };

  return (
    <Block className="mb-4 w-3/4 flex-col" title="Remove Duplicates">
      <div className="mb-2">
        <span>Rows Length: {tableRows}</span>
      </div>
      <div className="mb-2 flex items-center space-x-2">
        <Select value={selectedColumn} onValueChange={handleColumnChange}>
          <SelectTrigger>
            <SelectValue placeholder="Full Rows" />
          </SelectTrigger>
          <SelectContent>
            {fields.map((field) => (
              <SelectItem key={field} value={field}>
                {field}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className="rounded-md bg-red-500 px-3 py-2 text-white hover:bg-red-600"
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>
      {loading ? ( // Conditional rendering based on loading state
        <div className="text-center">Loading...</div>
      ) : selectedColumn && (
        <div className="mb-2 flex flex-col gap-2">
          <span>Current Row Length: {currentTableRows}</span>
          <span>Duplicates Removed: {numDuplicatesRemoved}</span>
        </div>
      )}
    </Block>
  );
}
