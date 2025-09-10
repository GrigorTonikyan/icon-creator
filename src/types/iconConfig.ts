export interface IconConfig {
  // Background gradients
  bgGradStart: string;
  bgGradMid: string;
  bgGradEnd: string;
  
  // Panel colors
  panelTop: string;
  panelMid: string;
  panelBot: string;
  
  // Input bar
  barStart: string;
  barEnd: string;
  inputText: string;
  
  // Inactive elements
  inactiveStart: string;
  inactiveEnd: string;
  
  // Accent and glow
  borderGlow: string;
  accent: string;
  
  // Dimensions
  iconSize: number;
  borderRadius: number;
  
  // Layout
  panelWidth: number;
  panelHeight: number;
  inputHeight: number;
  inactiveBarWidth: number;
  pillWidth: number;
  
  // Text and meta
  title: string;
  showTitle: boolean;
}

export const defaultIconConfig: IconConfig = {
  bgGradStart: '#1f3552',
  bgGradMid: '#0f2238',
  bgGradEnd: '#081523',
  panelTop: '#24415f',
  panelMid: '#172b42',
  panelBot: '#122234',
  barStart: '#aeb9c4',
  barEnd: '#8d98a4',
  inputText: 'text',
  inactiveStart: '#6d7680',
  inactiveEnd: '#59616a',
  borderGlow: '#7fd9ff',
  accent: '#9be4ff',
  iconSize: 512,
  borderRadius: 90,
  panelWidth: 50,
  panelHeight: 50,
  inputHeight: 74,
  inactiveBarWidth: 200,
  pillWidth: 96,
  title: 'Stylized glowing UI input panel with active text field, validation checkmark, list icon, and inactive bars.',
  showTitle: true,
};
