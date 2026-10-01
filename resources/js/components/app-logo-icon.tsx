import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M12 2C11.5 5 9.5 8 6.5 8.5C7.8 9.5 8.8 11.2 8.8 13.5C7.2 13 5 12.8 3.5 14C5 15.2 6.5 16.5 7.2 18H9C8.7 19.2 8 20.8 6 21.5C8.8 22 11 20.5 12 18.5C13 20.5 15.2 22 18 21.5C16 20.8 15.3 19.2 15 18H16.8C17.5 16.5 19 15.2 20.5 14C19 12.8 16.8 13 15.2 13.5C15.2 11.2 16.2 9.5 17.5 8.5C14.5 8 12.5 5 12 2Z"
                fill="currentColor"
            />
            <path
                d="M6.5 16.2H17.5V17.8H6.5V16.2Z"
                fill="currentColor"
            />
        </svg>
    );
}
