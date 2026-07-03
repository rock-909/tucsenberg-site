import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ExternalLinkIcon,
  FacebookIcon,
  GitHubIcon,
  LinkedInIcon,
  SocialIconLink,
  SocialIconMapper,
  TwitterIcon,
  YouTubeIcon,
} from "@/components/ui/social-icons";

const meta = {
  title: "UI/SocialIcons",
  component: SocialIconMapper,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    platform: "linkedin",
  },
} satisfies Meta<typeof SocialIconMapper>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-4 text-foreground">
      <TwitterIcon />
      <LinkedInIcon />
      <FacebookIcon />
      <YouTubeIcon />
      <GitHubIcon />
      <ExternalLinkIcon />
    </div>
  ),
};

export const MapperFallback: Story = {
  render: () => (
    <div className="flex items-center gap-4 text-muted-foreground">
      <SocialIconMapper platform="x" />
      <SocialIconMapper platform="linkedin" />
      <SocialIconMapper platform="github" />
      <SocialIconMapper platform="unknown-platform" />
    </div>
  ),
};

export const Links: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <SocialIconLink
        href="https://example.com/linkedin"
        platform="linkedin"
        aria-label="LinkedIn profile"
      />
      <SocialIconLink
        href="https://example.com/github"
        platform="github"
        aria-label="GitHub profile"
      />
      <SocialIconLink
        href="https://example.com"
        icon="external"
        label="Website"
        ariaLabel="Company website"
      />
    </div>
  ),
};

export const OnDarkBackground: Story = {
  parameters: {
    backgrounds: { default: "Dark" },
  },
  render: () => (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--neutral-11)] p-5 text-white">
      <SocialIconMapper platform="x" />
      <SocialIconMapper platform="youtube" />
      <SocialIconMapper platform="linkedin" />
    </div>
  ),
};
