// src/theme.js ou theme.js
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  styles: {
    global: {
      // styles globaux que vous souhaitez appliquer
      body: {
        bg: 'bisque',
        color: 'black',
      },
    },
  },
});

export default theme;
