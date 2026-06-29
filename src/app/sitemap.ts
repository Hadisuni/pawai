import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/blog';
import { getAllResearch } from '@/lib/research';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/research`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/demo`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/welcome`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/experiences`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/about`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/careers`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/press`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/help`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/trust`, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const postRoutes: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt ?? post.publishedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const researchRoutes: MetadataRoute.Sitemap = getAllResearch().map((insight) => ({
    url: `${SITE_URL}/research/${insight.slug}`,
    lastModified: insight.updatedAt ?? insight.publishedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...postRoutes, ...researchRoutes];
}
