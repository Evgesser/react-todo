import * as React from 'react';
import type { UseListsReturn, UseTodosReturn } from '@/types/hooks';

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

      // If loadLists returned null it means the request was aborted or failed.
      // In that case do not open the "new list" dialog (avoid showing it on
      // transient network errors or during page reloads).
      if (data === null) return;

      if (data && data.length > 0) {
        const firstActive = data.find((l) => !l.completed);
        const toSelect = firstActive || data[0];
        await listActions.selectList(toSelect._id);
        todoActions.setColor(toSelect.defaultColor || '#ffffff');
        // do not open the todo form automatically; leave it closed until user taps +
        await todoActions.fetchTodos(toSelect._id);
      } else {
        setNewListDialogOpen(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
}
