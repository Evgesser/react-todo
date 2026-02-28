import * as React from 'react';
import { Paper, Typography, Grow } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

interface CollapsibleBarProps {
  formOpen: boolean;
  lastAdded: string | null;
  onClick: () => void;
}

const CollapsibleBar: React.FC<CollapsibleBarProps> = ({ formOpen, lastAdded, onClick }) => {
  if (formOpen) return null;
  return (
    <Grow in timeout={300}>
      <Paper
        sx={{
          p: 1,
          mb: 2,
          cursor: 'pointer',
          bgcolor: 'background.paper',
          color: 'text.primary',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        elevation={2}
        onClick={onClick}
      >
        <Typography variant="body2" sx={{ color: 'inherit', display: 'flex', alignItems: 'center' }}>
          {lastAdded ? `Последний добавленный: ${lastAdded}` : <MoreHorizIcon fontSize="small" />}
        </Typography>
      </Paper>
    </Grow>
  );
};

export default CollapsibleBar;
