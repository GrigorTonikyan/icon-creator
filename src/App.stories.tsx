import type { Meta, StoryObj } from "@storybook/react";
import { App } from "./App";

const meta: Meta<typeof App> = {
    title: "App/Main",
    component: App,
    parameters: {
        layout: "fullscreen",
    },
    tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
