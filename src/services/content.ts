/** Blog, comment moderation, contact inbox, team, and the CMS page sections. */

import { getDb, nextId, nowIso } from '@/mocks/db';
import { bannerImage } from '@/mocks/imagery';
import { slugify } from '@/lib/utils';
import { createCrudService } from './crud';
import { notFound, respond, respondAndCommit, runQuery } from './core';
import type { ListParams, Paginated } from '@/types/api';
import type {
  AboutSection,
  AboutStat,
  BlogComment,
  BlogCommentListItem,
  BlogPost,
  BlogPostListItem,
  ContactMessage,
  ContactSetting,
  HeroPageKey,
  HeroPageSetting,
  HomeSection,
  TeamMember,
} from '@/types/domain';
import type {
  AboutSectionValues,
  AboutStatValues,
  BlogPostValues,
  ContactSettingValues,
  HeroPageValues,
  HomeSectionValues,
  TeamMemberValues,
} from '@/lib/schemas';

/* --------------------------------------------------------------- blog posts */

function decoratePost(post: BlogPost): BlogPostListItem {
  return {
    ...post,
    author_name: getDb().adminUsers.find((u) => u.id === post.author_id)?.name ?? 'Magic Show',
  };
}

export const blogPostsService = {
  list(params: ListParams = {}): Promise<Paginated<BlogPostListItem>> {
    const rows = getDb().blogPosts.map(decoratePost);
    return respond(
      runQuery(rows, params, {
        search: [(p) => p.title, (p) => p.excerpt, (p) => p.tags.join(' '), (p) => p.author_name],
        filters: {
          status: (p, v) => p.status === v,
          is_featured: (p, v) => String(p.is_featured) === v,
          author_id: (p, v) => String(p.author_id) === v,
          tag: (p, v) => p.tags.includes(v),
        },
        sorters: {
          title: (p) => p.title,
          status: (p) => p.status,
          view_count: (p) => p.view_count,
          comment_count: (p) => p.comment_count,
          published_at: (p) => p.published_at,
          created_at: (p) => p.created_at,
        },
        defaultSort: { by: 'created_at', dir: 'desc' },
      }),
    );
  },

  get(id: number): Promise<BlogPostListItem> {
    const post = getDb().blogPosts.find((p) => p.id === id);
    if (!post) notFound('Post', id);
    return respond(decoratePost(post));
  },

  /** Every distinct tag across the blog, for the filter dropdown. */
  tags(): Promise<string[]> {
    const set = new Set<string>();
    for (const post of getDb().blogPosts) post.tags.forEach((t) => set.add(t));
    return respond([...set].sort());
  },

  create(input: BlogPostValues): Promise<BlogPostListItem> {
    const db = getDb();
    const post: BlogPost = {
      id: nextId(db.blogPosts),
      title: input.title,
      slug: input.slug || slugify(input.title),
      excerpt: input.excerpt,
      content: input.content,
      status: input.status,
      is_featured: input.is_featured,
      allow_comments: input.allow_comments,
      view_count: 0,
      comment_count: 0,
      cover_image: bannerImage(input.title),
      tags: input.tags.split(',').map((t) => t.trim()).filter(Boolean),
      meta_title: input.meta_title || `${input.title} | Magic Show Journal`,
      meta_description: input.meta_description || input.excerpt.slice(0, 155),
      author_id: input.author_id,
      published_at: input.published_at ? new Date(input.published_at).toISOString() : null,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    db.blogPosts.unshift(post);
    return respondAndCommit(decoratePost(post));
  },

  update(id: number, input: BlogPostValues): Promise<BlogPostListItem> {
    const db = getDb();
    const index = db.blogPosts.findIndex((p) => p.id === id);
    if (index === -1) notFound('Post', id);
    const existing = db.blogPosts[index]!;
    const post: BlogPost = {
      ...existing,
      title: input.title,
      slug: input.slug || slugify(input.title),
      excerpt: input.excerpt,
      content: input.content,
      status: input.status,
      is_featured: input.is_featured,
      allow_comments: input.allow_comments,
      tags: input.tags.split(',').map((t) => t.trim()).filter(Boolean),
      meta_title: input.meta_title,
      meta_description: input.meta_description,
      author_id: input.author_id,
      published_at: input.published_at ? new Date(input.published_at).toISOString() : null,
      updated_at: nowIso(),
    };
    db.blogPosts[index] = post;
    return respondAndCommit(decoratePost(post));
  },

  patch(id: number, changes: Partial<BlogPost>): Promise<BlogPostListItem> {
    const db = getDb();
    const index = db.blogPosts.findIndex((p) => p.id === id);
    if (index === -1) notFound('Post', id);
    const post = { ...db.blogPosts[index]!, ...changes, id, updated_at: nowIso() };
    db.blogPosts[index] = post;
    return respondAndCommit(decoratePost(post));
  },

  remove(id: number): Promise<{ id: number }> {
    const db = getDb();
    const index = db.blogPosts.findIndex((p) => p.id === id);
    if (index === -1) notFound('Post', id);
    db.blogPosts.splice(index, 1);
    db.blogComments = db.blogComments.filter((c) => c.blog_post_id !== id);
    return respondAndCommit({ id });
  },
};

/* ----------------------------------------------------------------- comments */

function decorateComment(comment: BlogComment): BlogCommentListItem {
  return {
    ...comment,
    post_title: getDb().blogPosts.find((p) => p.id === comment.blog_post_id)?.title ?? 'Deleted post',
  };
}

function recountComments(postId: number): void {
  const db = getDb();
  const post = db.blogPosts.find((p) => p.id === postId);
  if (post) post.comment_count = db.blogComments.filter((c) => c.blog_post_id === postId).length;
}

export const blogCommentsService = {
  list(params: ListParams = {}): Promise<Paginated<BlogCommentListItem>> {
    const rows = getDb().blogComments.map(decorateComment);
    return respond(
      runQuery(rows, params, {
        search: [(c) => c.author_name, (c) => c.author_email, (c) => c.comment, (c) => c.post_title],
        filters: {
          is_approved: (c, v) => String(c.is_approved) === v,
          blog_post_id: (c, v) => String(c.blog_post_id) === v,
        },
        sorters: {
          created_at: (c) => c.created_at,
          author_name: (c) => c.author_name,
          post_title: (c) => c.post_title,
        },
        defaultSort: { by: 'created_at', dir: 'desc' },
      }),
    );
  },

  setApproval(id: number, isApproved: boolean): Promise<BlogCommentListItem> {
    const comment = getDb().blogComments.find((c) => c.id === id);
    if (!comment) notFound('Comment', id);
    comment.is_approved = isApproved;
    return respondAndCommit(decorateComment(comment));
  },

  remove(id: number): Promise<{ id: number }> {
    const db = getDb();
    const index = db.blogComments.findIndex((c) => c.id === id);
    if (index === -1) notFound('Comment', id);
    const postId = db.blogComments[index]!.blog_post_id;
    db.blogComments.splice(index, 1);
    recountComments(postId);
    return respondAndCommit({ id });
  },

  bulkApprove(ids: number[]): Promise<{ updated: number }> {
    const db = getDb();
    let updated = 0;
    for (const comment of db.blogComments) {
      if (!ids.includes(comment.id) || comment.is_approved) continue;
      comment.is_approved = true;
      updated += 1;
    }
    return respondAndCommit({ updated });
  },
};

/* --------------------------------------------------------- contact messages */

export const contactMessagesService = {
  list(params: ListParams = {}): Promise<Paginated<ContactMessage>> {
    return respond(
      runQuery(getDb().contactMessages, params, {
        search: [
          (m) => `${m.first_name} ${m.last_name}`,
          (m) => m.email,
          (m) => m.subject,
          (m) => m.message,
        ],
        filters: { status: (m, v) => m.status === v },
        sorters: {
          created_at: (m) => m.created_at,
          subject: (m) => m.subject,
          status: (m) => m.status,
          name: (m) => `${m.first_name} ${m.last_name}`,
        },
        defaultSort: { by: 'created_at', dir: 'desc' },
      }),
    );
  },

  get(id: number): Promise<ContactMessage> {
    const message = getDb().contactMessages.find((m) => m.id === id);
    if (!message) notFound('Message', id);
    return respond(message);
  },

  setStatus(id: number, status: ContactMessage['status']): Promise<ContactMessage> {
    const message = getDb().contactMessages.find((m) => m.id === id);
    if (!message) notFound('Message', id);
    message.status = status;
    if (status === 'replied' && !message.replied_at) message.replied_at = nowIso();
    return respondAndCommit(message);
  },

  remove(id: number): Promise<{ id: number }> {
    const db = getDb();
    const index = db.contactMessages.findIndex((m) => m.id === id);
    if (index === -1) notFound('Message', id);
    db.contactMessages.splice(index, 1);
    return respondAndCommit({ id });
  },

  counts(): Promise<Record<ContactMessage['status'], number> & { total: number }> {
    const rows = getDb().contactMessages;
    return respond({
      total: rows.length,
      new: rows.filter((m) => m.status === 'new').length,
      read: rows.filter((m) => m.status === 'read').length,
      replied: rows.filter((m) => m.status === 'replied').length,
      archived: rows.filter((m) => m.status === 'archived').length,
    });
  },
};

/* --------------------------------------------------------------------- team */

export const teamService = createCrudService<TeamMember, TeamMemberValues>({
  label: 'Team member',
  collection: 'teamMembers',
  allSort: (a, b) => a.sort_order - b.sort_order,
  query: {
    search: [(t) => t.name, (t) => t.role, (t) => t.bio, (t) => t.email],
    filters: { is_active: (t, v) => String(t.is_active) === v },
    sorters: { name: (t) => t.name, role: (t) => t.role, sort_order: (t) => t.sort_order },
    defaultSort: { by: 'sort_order', dir: 'asc' },
  },
  fromInput: (input, existing) => ({
    ...input,
    created_at: existing?.created_at ?? nowIso(),
    updated_at: nowIso(),
  }),
});

/* ---------------------------------------------------------------- cms pages */

export const homeSectionsService = createCrudService<HomeSection, HomeSectionValues>({
  label: 'Home section',
  collection: 'homeSections',
  allSort: (a, b) => a.sort_order - b.sort_order,
  query: {
    search: [(s) => s.title, (s) => s.section_key, (s) => s.subtitle],
    filters: { is_active: (s, v) => String(s.is_active) === v },
    sorters: { title: (s) => s.title, sort_order: (s) => s.sort_order },
    defaultSort: { by: 'sort_order', dir: 'asc' },
  },
  fromInput: (input) => ({ ...input }),
});

export const aboutSectionsService = createCrudService<AboutSection, AboutSectionValues>({
  label: 'About section',
  collection: 'aboutSections',
  query: {
    search: [(s) => s.title, (s) => s.section_key, (s) => s.description],
    filters: { is_active: (s, v) => String(s.is_active) === v },
    sorters: { title: (s) => s.title },
  },
  fromInput: (input) => ({
    section_key: input.section_key,
    title: input.title,
    subtitle: input.subtitle,
    description: input.description,
    button_text: input.button_text,
    button_link: input.button_link,
    features: input.features.split('\n').map((f) => f.trim()).filter(Boolean),
    is_active: input.is_active,
  }),
});

export const aboutStatsService = createCrudService<AboutStat, AboutStatValues>({
  label: 'About stat',
  collection: 'aboutStats',
  allSort: (a, b) => a.sort_order - b.sort_order,
  query: {
    search: [(s) => s.title, (s) => s.icon],
    filters: { is_active: (s, v) => String(s.is_active) === v },
    sorters: { title: (s) => s.title, value: (s) => s.value, sort_order: (s) => s.sort_order },
    defaultSort: { by: 'sort_order', dir: 'asc' },
  },
  fromInput: (input) => ({ ...input }),
});

export const heroPagesService = {
  all(): Promise<HeroPageSetting[]> {
    return respond(getDb().heroPages);
  },
  get(page: HeroPageKey): Promise<HeroPageSetting> {
    const row = getDb().heroPages.find((h) => h.page === page);
    if (!row) notFound('Page hero', page);
    return respond(row);
  },
  update(page: HeroPageKey, input: HeroPageValues): Promise<HeroPageSetting> {
    const db = getDb();
    const index = db.heroPages.findIndex((h) => h.page === page);
    if (index === -1) notFound('Page hero', page);
    const row: HeroPageSetting = { ...db.heroPages[index]!, ...input, page };
    db.heroPages[index] = row;
    return respondAndCommit(row);
  },
};

export const contactSettingService = {
  get(): Promise<ContactSetting> {
    return respond(getDb().contactSetting);
  },
  update(input: ContactSettingValues): Promise<ContactSetting> {
    const db = getDb();
    db.contactSetting = { ...db.contactSetting, ...input };
    return respondAndCommit(db.contactSetting);
  },
};
