import * as React from 'react';
import { Box, Typography, Card, CardContent, CardActions, Button } from '@mui/material';
import type { ListType } from '@/types';
import { listTypes } from '@/constants';
import type { TranslationKeys } from '@/locales/ru';

interface ListTypeSelectorProps {
  t: TranslationKeys;
  onSelect: (type: ListType) => void;
}

export default function ListTypeSelector({ t, onSelect }: ListTypeSelectorProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: '100%' }}>
      <Typography variant="h5" align="center" sx={{ mb: 1 }}>
        {t.listTypes.selectTitle}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          width: '100%',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
        }}
      >
        {listTypes.map((lt) => {
          const Icon = lt.icon;
          return (
            <Card key={lt.value} variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <Box sx={{ fontSize: 40, color: 'primary.main' }}>
                  <Icon fontSize="inherit" />
                </Box>
                <Typography variant="h6" align="center">
                  {t.listTypes[lt.key as keyof typeof t.listTypes]}
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary">
                  {t.listTypes[`${lt.key}Desc` as keyof typeof t.listTypes]}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', p: 2 }}>
                <Button fullWidth variant="contained" onClick={() => onSelect(lt.value)}>
                  {t.buttons.create}
                </Button>
              </CardActions>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
