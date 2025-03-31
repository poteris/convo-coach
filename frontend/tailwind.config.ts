import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			pcsprimary: {
  				'01': 'hsl(var(--pcsprimary-01))',
  				'02': 'hsl(var(--pcsprimary-02))',
  				'03': 'hsl(var(--pcsprimary-03))',
  				'04': 'hsl(var(--pcsprimary-04))',
  				'05': 'hsl(var(--pcsprimary-05))',
  				'06': 'hsl(var(--pcsprimary-06))',
  				'07': 'hsl(var(--pcsprimary-07))',
  				'01-light': 'hsl(var(--pcsprimary01-light))'
  			},
  			pcssecondary: {
  				'01': 'hsl(var(--pcssecondary-01))',
  				'02': 'hsl(var(--pcssecondary-02))',
  				'03': 'hsl(var(--pcssecondary-03))',
  				'04': 'hsl(var(--pcssecondary-04))',
  				'05': 'hsl(var(--pcssecondary-05))',
  				'06': 'hsl(var(--pcssecondary-06))',
  				'07': 'hsl(var(--pcssecondary-07))',
  				'08': 'hsl(var(--pcssecondary-08))'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			'card-alt': {
  				DEFAULT: 'hsl(var(--card-alt))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--pcsprimary-01))',
  				foreground: 'hsl(var(--primary-foreground))',
  				light: 'hsl(var(--pcsprimary01-light))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--pcssecondary-01))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			'roboto-slab': [
  				'var(--font-roboto-slab)',
  				'serif'
  			]
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [tailwindcssAnimate],
};

export default config;
