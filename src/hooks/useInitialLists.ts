import * as React from 'react';
import { UseListsReturn } from './useLists';
import { UseTodosReturn } from './useTodos';

/**
 * Effect that loads the user's lists when the userId changes and then selects
 * the first active list (or opens the "new list" dialog if there are none).
 */
export function useInitialLists(
  userId: string | null,
  listActions: UseListsReturn,
  todoActions: UseTodosReturn,
  setFormOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setNewListDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
) {
  React.useEffect(() => {
    if (!userId) return;

    (async () => {
      const data = await listActions.loadLists();
      if (data && data.length > 0) {
        const firstActive = data.find((l) => !l.completed);
        if (firstActive) {
          await listActions.selectList(firstActive._id);
          todoActions.setColor(firstActive.defaultColor || '#ffffff');
          setFormOpen(true);
          await todoActions.fetchTodos(firstActive._id);
        } else {
          setNewListDialogOpen(true);
        }
      } else {
        setNewListDialogOpen(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
}
