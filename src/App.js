/* eslint-disable */
import * as React from 'react';
import {
  ThemeProvider,
  StylesProvider,
  createGenerateClassName,
} from '@material-ui/core/styles';
import WidgetNavigation from './example/WidgetNavigation';

const generateClassName = createGenerateClassName({
	disableGlobal: false, // Class names need to be deterministic,
});

function App() {
	return (
		<StylesProvider generateClassName={generateClassName}>
			<ThemeProvider>
				<WidgetNavigation />
			</ThemeProvider>
		</StylesProvider>
	);
}

export default App;