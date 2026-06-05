import { createContext } from "react";
import type { PointerEvent } from "react";
import { ShelfItem } from "../hooks/useShelf";

// Lets FsNode (rendered deep inside react-flow) start a drag without prop-drilling.
export const DragContext = createContext<{
  startNodeDrag: (e: PointerEvent, item: ShelfItem) => void;
} | null>(null);
