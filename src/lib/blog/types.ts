export interface StarterBlogSection {
  heading: string;
  body: string;
}

export interface StarterBlogArticle {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: readonly string[];
  publishedAt: string;
  updatedAt?: string;
  author?: string;
  image?: string;
  readingTime: string;
  sections: readonly StarterBlogSection[];
}
