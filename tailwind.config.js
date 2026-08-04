/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: [
  				'var(--font-geist-sans)',
  				'system-ui',
  				'sans-serif'
  			],
  			'mkt-sans': [
  				'var(--font-space-grotesk)',
  				'ui-sans-serif',
  				'system-ui',
  				'sans-serif'
  			],
  			'mkt-mono': [
  				'var(--font-jetbrains-mono)',
  				'ui-monospace',
  				'monospace'
  			],
  			'mkt-serif': [
  				'var(--font-tiempos)',
  				'var(--font-serif)',
  				'Georgia',
  				'serif'
  			],
  			mono: [
  				'var(--font-mono)',
  				'ui-monospace',
  				'SFMono-Regular',
  				'monospace'
  			],
  			display: [
  				'var(--font-display)',
  				'ui-sans-serif',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		fontSize: {
  			'display-sm': [
  				'1.75rem',
  				{
  					lineHeight: '2.125rem',
  					letterSpacing: '-0.025em',
  					fontWeight: '600'
  				}
  			],
  			title: [
  				'1.0625rem',
  				{
  					lineHeight: '1.5rem',
  					letterSpacing: '-0.015em',
  					fontWeight: '600'
  				}
  			],
  			body: [
  				'0.9375rem',
  				{
  					lineHeight: '1.5rem',
  					fontWeight: '400'
  				}
  			],
  			caption: [
  				'0.8125rem',
  				{
  					lineHeight: '1.25rem',
  					fontWeight: '400'
  				}
  			],
  			label: [
  				'0.6875rem',
  				{
  					lineHeight: '1rem',
  					letterSpacing: '0.04em',
  					fontWeight: '500'
  				}
  			],
  			'mkt-h1': [
  				'4rem',
  				{
  					lineHeight: '1.05',
  					letterSpacing: '-0.03em',
  					fontWeight: '700'
  				}
  			],
  			'mkt-h2': [
  				'2.75rem',
  				{
  					lineHeight: '1.1',
  					letterSpacing: '-0.025em',
  					fontWeight: '700'
  				}
  			],
  			'mkt-h3': [
  				'1.75rem',
  				{
  					lineHeight: '1.2',
  					letterSpacing: '-0.02em',
  					fontWeight: '600'
  				}
  			],
  			'mkt-body': [
  				'1.0625rem',
  				{
  					lineHeight: '1.6',
  					fontWeight: '400'
  				}
  			],
  			'mkt-small': [
  				'0.875rem',
  				{
  					lineHeight: '1.5',
  					fontWeight: '400'
  				}
  			]
  		},
  		boxShadow: {
  			surface: '0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)',
  			raised: '0 2px 4px rgba(0,0,0,0.06), 0 8px 24px -4px rgba(0,0,0,0.08)',
  			overlay: '0 16px 40px -8px rgba(0,0,0,0.12), 0 4px 12px -4px rgba(0,0,0,0.08)'
  		},
  		maxWidth: {
  			'mkt-content': 'var(--mkt-max-content-width)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			'mkt-button': 'var(--mkt-radius-button)',
  			'mkt-card': 'var(--mkt-radius-card)',
  			'mkt-browser': 'var(--mkt-radius-browser)'
  		},
  		colors: {
  			border: 'var(--border)',
  			input: 'var(--input)',
  			ring: 'var(--ring)',
  			background: 'var(--background)',
  			foreground: 'var(--foreground)',
  			primary: {
  				'50': 'var(--brand-50)',
  				'100': 'var(--brand-100)',
  				'200': 'var(--brand-200)',
  				'300': 'var(--brand-300)',
  				'400': 'var(--brand-400)',
  				'500': 'var(--brand-500)',
  				'600': 'var(--brand-600)',
  				'700': 'var(--brand-700)',
  				'800': 'var(--brand-800)',
  				'900': 'var(--brand-900)',
  				DEFAULT: 'var(--primary)',
  				foreground: 'var(--primary-foreground)',
  			},
  			secondary: {
  				DEFAULT: 'var(--secondary)',
  				foreground: 'var(--secondary-foreground)'
  			},
  			destructive: {
  				DEFAULT: 'var(--destructive)',
  				foreground: 'var(--destructive-foreground)'
  			},
  			muted: {
  				DEFAULT: 'var(--muted)',
  				foreground: 'var(--muted-foreground)'
  			},
  			accent: {
  				DEFAULT: 'var(--accent)',
  				foreground: 'var(--accent-foreground)'
  			},
  			popover: {
  				DEFAULT: 'var(--popover)',
  				foreground: 'var(--popover-foreground)'
  			},
  			card: {
  				DEFAULT: 'var(--card)',
  				foreground: 'var(--card-foreground)'
  			},
  			gray: {
  				'50': 'var(--gray-50)',
  				'100': 'var(--gray-100)',
  				'150': 'var(--gray-150)',
  				'200': 'var(--gray-200)',
  				'300': 'var(--gray-300)',
  				'400': 'var(--gray-400)',
  				'450': 'var(--gray-450)',
  				'500': 'var(--gray-500)',
  				'600': 'var(--gray-600)',
  				'700': 'var(--gray-700)',
  				'800': 'var(--gray-800)',
  				'900': 'var(--gray-900)',
  				'950': 'var(--gray-950)'
  			},
  			ink: {
  				'600': 'var(--gray-600)',
  				'700': '#000000',
  				'800': '#000000',
  				'900': 'var(--ink)',
  				DEFAULT: 'var(--ink)'
  			},
  			brand: {
  				'50': 'var(--brand-50)',
  				'100': 'var(--brand-100)',
  				'200': 'var(--brand-200)',
  				'300': 'var(--brand-300)',
  				'400': 'var(--brand-400)',
  				'500': 'var(--brand-500)',
  				'600': 'var(--brand-600)',
  				'700': 'var(--brand-700)',
  				'800': 'var(--brand-800)',
  				'900': 'var(--brand-900)',
  				DEFAULT: 'var(--brand-500)'
  			},
  			champagne: {
  				'50': 'var(--champagne-50)',
  				'100': 'var(--champagne-100)',
  				'200': 'var(--champagne-200)',
  				'300': 'var(--champagne-300)',
  				'400': 'var(--champagne-400)',
  				'500': 'var(--champagne-500)',
  				'600': 'var(--champagne-600)',
  				'700': 'var(--champagne-700)',
  				'800': 'var(--champagne-800)',
  				'900': 'var(--champagne-900)'
  			},
  			amber: {
  				'50': 'var(--amber-50)',
  				'100': 'var(--amber-100)',
  				'200': 'var(--amber-200)',
  				'300': 'var(--amber-300)',
  				'400': 'var(--amber-400)',
  				'500': 'var(--amber-500)',
  				'600': 'var(--amber-600)',
  				'700': 'var(--amber-700)',
  				'800': 'var(--amber-800)',
  				'900': 'var(--amber-900)'
  			},
  			teal: {
  				'50': 'var(--teal-50)',
  				'100': 'var(--teal-100)',
  				'200': 'var(--teal-200)',
  				'300': 'var(--teal-300)',
  				'400': 'var(--teal-400)',
  				'500': 'var(--teal-500)',
  				'600': 'var(--teal-600)',
  				'700': 'var(--teal-700)',
  				'800': 'var(--teal-800)',
  				'900': 'var(--teal-900)'
  			},
  			emerald: {
  				'50': 'var(--emerald-50)',
  				'100': 'var(--emerald-100)',
  				'200': 'var(--emerald-200)',
  				'300': 'var(--emerald-300)',
  				'400': 'var(--emerald-400)',
  				'500': 'var(--emerald-500)',
  				'600': 'var(--emerald-600)',
  				'700': 'var(--emerald-700)',
  				'800': 'var(--emerald-800)',
  				'900': 'var(--emerald-900)'
  			},
  			rose: {
  				'50': 'var(--rose-50)',
  				'100': 'var(--rose-100)',
  				'200': 'var(--rose-200)',
  				'300': 'var(--rose-300)',
  				'400': 'var(--rose-400)',
  				'500': 'var(--rose-500)',
  				'600': 'var(--rose-600)',
  				'700': 'var(--rose-700)',
  				'800': 'var(--rose-800)',
  				'900': 'var(--rose-900)'
  			},
  			sky: {
  				'50': 'var(--sky-50)',
  				'100': 'var(--sky-100)',
  				'200': 'var(--sky-200)',
  				'300': 'var(--sky-300)',
  				'400': 'var(--sky-400)',
  				'500': 'var(--sky-500)',
  				'600': 'var(--sky-600)',
  				'700': 'var(--sky-700)',
  				'800': 'var(--sky-800)',
  				'900': 'var(--sky-900)'
  			},
  			mkt: {
  				background: 'var(--mkt-background)',
  				surface: {
  					DEFAULT: 'var(--mkt-surface)',
  					muted: 'var(--mkt-surface-muted)'
  				},
  				foreground: 'var(--mkt-text-primary)',
  				secondary: 'var(--mkt-text-secondary)',
  				border: 'var(--mkt-border)',
  				accent: {
  					DEFAULT: 'var(--mkt-accent)',
  					hover: 'var(--mkt-accent-hover)',
  					foreground: 'var(--mkt-accent-foreground)'
  				},
  				muted: 'var(--mkt-muted)',
  				mock: 'var(--mkt-mock-surface)',
  				dot: 'var(--mkt-browser-dot)',
  				tag: {
  					green: {
  						bg: 'var(--mkt-tag-green-bg)',
  						text: 'var(--mkt-tag-green-text)'
  					},
  					blue: {
  						bg: 'var(--mkt-tag-blue-bg)',
  						text: 'var(--mkt-tag-blue-text)'
  					},
  					amber: {
  						bg: 'var(--mkt-tag-amber-bg)',
  						text: 'var(--mkt-tag-amber-text)'
  					}
  				}
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			marquee: {
  				'0%': {
  					transform: 'translateX(0)'
  				},
  				'100%': {
  					transform: 'translateX(-50%)'
  				}
  			}
  		},
  		animation: {
  			marquee: 'marquee var(--duration, 40s) linear infinite'
  		}
  	}
  },
  plugins: [require('tailwindcss-animate')],
};
