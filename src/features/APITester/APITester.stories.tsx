import type { Meta, StoryObj } from "@storybook/react";
import { APITester } from "./APITester";

const meta: Meta<typeof APITester> = {
    title: "Features/APITester",
    component: APITester,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        className: {
            control: "text",
            description: "Additional CSS class names",
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};

export const WithCustomClass: Story = {
    args: {
        className: "custom-style",
    },
};

export const Loading: Story = {
    args: {},
    parameters: {
        docs: {
            description: {
                story: "APITester in a state where a request is being processed.",
            },
        },
    },
};

export const Success: Story = {
    args: {},
    parameters: {
        docs: {
            description: {
                story: "APITester after a successful API response (status 200).",
            },
        },
    },
};

export const Error: Story = {
    args: {},
    parameters: {
        docs: {
            description: {
                story: "APITester after an error response (status 4xx or 5xx).",
            },
        },
    },
};
