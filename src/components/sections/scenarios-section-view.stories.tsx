import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MINIMAL_VIEWPORTS } from "storybook/viewport";

import {
  homepageStoryScenarios,
  homepageStoryScenariosZh,
} from "@/components/sections/homepage-section.fixtures";
import {
  ScenariosSectionView,
  type ScenarioSectionItem,
} from "@/components/sections/scenarios-section-view";

const homepageStoryScenariosLongCopy = homepageStoryScenarios.map(
  (scenario, index) => ({
    ...scenario,
    title:
      index === 0
        ? "Long product, service, proof, and inquiry scenario for layout review"
        : scenario.title,
    description:
      index === 0
        ? "This story checks whether scenario cards keep their visual rhythm when real project copy needs to explain offering scope, replacement rules, proof boundaries, and next steps."
        : scenario.description,
  }),
) satisfies ScenarioSectionItem[];

const meta = {
  title: "Sections/ScenariosSectionView",
  component: ScenariosSectionView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    title: "Starter scenarios",
    subtitle:
      "Show common ways this website starter can be adapted for a real project.",
    items: homepageStoryScenarios,
  },
} satisfies Meta<typeof ScenariosSectionView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongCopy: Story = {
  args: {
    title:
      "Starter scenarios for product, service, and custom project replacement",
    items: homepageStoryScenariosLongCopy,
  },
};

export const ChineseCopy: Story = {
  args: {
    title: "模板适用场景",
    subtitle: "展示这套网站模板可以如何替换为真实项目。",
    items: homepageStoryScenariosZh,
  },
};

export const NarrowCanvas: Story = {
  args: {
    items: homepageStoryScenariosLongCopy,
  },
  globals: {
    viewport: { value: "mobile1", isRotated: false },
  },
  parameters: {
    viewport: {
      options: MINIMAL_VIEWPORTS,
    },
  },
};
