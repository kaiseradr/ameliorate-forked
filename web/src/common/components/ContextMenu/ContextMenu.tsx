import { Menu as MuiMenu } from "@mui/material";

import { closeContextMenu } from "../../store/contextMenuActions";
import { useAnchorPosition, useContextMenuContext } from "../../store/contextMenuStore";
import { DeleteEdgeMenuItem } from "./DeleteEdgeMenuItem";
import { DeleteNodeMenuItem } from "./DeleteNodeMenuItem";
import { ShowCriteriaMenuItem } from "./ShowCriteriaMenuItem";

export const ContextMenu = () => {
  const anchorPosition = useAnchorPosition();
  const contextMenuContext = useContextMenuContext();

  if (contextMenuContext === undefined) return <></>;

  const isOpen = Boolean(anchorPosition);

  // create these based on what's set in the context
  const menuItems = (
    <>
      {contextMenuContext.node && <ShowCriteriaMenuItem node={contextMenuContext.node} />}
      {contextMenuContext.node && <DeleteNodeMenuItem node={contextMenuContext.node} />}
      {contextMenuContext.edge && <DeleteEdgeMenuItem edge={contextMenuContext.edge} />}
    </>
  );

  return (
    <MuiMenu
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition}
      open={isOpen}
      onClose={closeContextMenu}
    >
      {menuItems}
    </MuiMenu>
  );
};
