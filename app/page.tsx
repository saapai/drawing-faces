'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';

interface Comment {
  id: string;
  text: string;
  name: string;
  timestamp: number;
}

type Vote = 'up' | 'down' | null;

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

type Block =
  | { type: 'p'; id: string; text: string; first?: true }
  | { type: 'break'; id: string };

const ESSAY: Block[] = [
  { type: 'p', id: 'p1', first: true, text: 'when i was about 13, i took this art camp that perceptually skyrocketed my drawing ability. to clarify, by perceptually i mean it particularly improved the final product, as opposed to my actual drawing skills.' },
  { type: 'p', id: 'p2', text: 'the reason was, my teacher taught me a clever shortcut of basically replicating nice drawings by using a graphite sheet to transpose an outline and then just do the shading how i wanted.' },
  { type: 'p', id: 'p3', text: 'i would start with an outline and then improvise on top of it to create a finished drawing. looking back on it, one could make the argument that it was more of a shading class.' },
  { type: 'p', id: 'p4', text: "so this summer i decided my main goal would be to finish a nice drawing from scratch. at the beginning i wanted to learn how to draw faces, but i didn't want to copy from a tutorial because i wanted it to be my style. from that point i ended up just getting frustrated after repeatedly trying to draw an entire face with different levels of complexity." },
  { type: 'p', id: 'p5', text: 'and then i just gave up, maybe expecting some wave of divine inspiration or something to suddenly convince me to draw something compelling.' },
  { type: 'p', id: 'p6', text: 'the other day i decided i was just going to draw what was in front of me in my room, but i had no clue how to start. before i even started i was about to give up just thinking about all the complexity of the table, stand, clothes, etc. all in front of me.' },
  { type: 'p', id: 'p7', text: "however, this time i then just decided to pick what seemed to be the most central and interesting thing in my room which was my stand. my first iteration was about as terrible as i could have expected. but this time instead of trying to just move on, hoping my next object would improve, i kinda scribbled over my initial attempt trying to make a rough estimation of why i was getting the angles and 3D projection wrong, and kept scribbling over as i was trying to troubleshoot my representation, until ultimately i fixated on the corner of my table. then i got intrigued about how if people could render 3D space onto a 2D medium, it should be possible to do the same with 4D onto a 3D medium. and then from that point on i was in an autopilot-esque, where i wasn't thinking about if what i was about to draw was exactly correct, but i would draw and use whatever i had and mold it into the correct thing, pressing darker to proportionally erase any mistakes i had made." },
  { type: 'p', id: 'p8', text: 'as i was drawing like this, i felt like i had instantly just learned how to draw. slowly i progressed with the same trick to other things on my stand, different details of my stand and various other objects in my room. and then after a few minutes, i was looking at the drawing, and i was very intrigued because if i were to try to replicate this drawing or create something similar, i could imagine myself to get really easily stuck.' },
  { type: 'p', id: 'p9', text: 'after i was satisfied with how much i had drawn, i showed my roommate, trying to explain how i was trying to figure out how to learn how to represent 3D space well in my drawings.' },
  { type: 'p', id: 'p10', text: "he responded asking why i didn't just look it up. looking back this was an interesting moment of pause for me, which is why this piece of writing exist. i think there is an enormous alpha in wanting to figure out how to draw the way i did. if i had just looked it up, it would've been the equivalent of what i had done earlier in my life, where i had pretty finished drawings, but hadn't truly gone through the messy, interesting process of drawing. instead of developing this new strategy of drawing, which had some interesting thread i could pull at that could affect other parts of my life, i would have rather just known exactly how to draw a stand." },
  { type: 'p', id: 'p11', text: "looking back on my life, i have a couple mild regrets about the way i approached learning, in which i resorted to the more shallow shading shortcut. before i graduated high school, i had convinced myself history was useless and something that never interested me through my life. it wasn't until in college i naturally became interested in certain parts of history that would help me get through whatever mental block i encountered. now, i unfortunately feel like i missed the boat a bit on history and have little foundation to start because history is so infinite and told from in infinite-ish voices." },
  { type: 'break', id: 'break1' },
  { type: 'p', id: 'p12', text: "i now unfortunately feel like the world, at least my direct and indirect environments, seem to have gone in the direction of the shading shortcut, which i think is really unfortunate. i do think taking shortcuts in life is necessary, because otherwise you wouldn't really get anywhere. for instance, i would never want to grow my own food, unless i'm happy with it consuming a lot of my time. similarly, i think using shortcuts is helpful to make you faster and more focused, but i think innovation has brought the average person (at least definitely in the US, or even more specifically, US student) to the point where it seems reasonable to just take the shortcut on everything." },
  { type: 'p', id: 'p13', text: 'my molding strategy in drawing gave me some interesting thoughts about 3D vs 4D space, whereas if i had just watched a tutorial, that almost certainly would not have happened.' },
  { type: 'p', id: 'p14', text: 'this may seem a little contrived, so let me start again with another example.' },
  { type: 'p', id: 'p15', text: "if you take the same walk to class every day, you have very little variance in the butterfly effect of who you meet and interact with, whereas if you slightly improvised your walk every day, you would increase your chance of something serendipitous happening. there's a nonzero chance of that serendipitous thing being meeting your future spouse on your varied walk. given that reasoning, it seems almost absurd to take the same walk every day, because you are stunting your odds of meeting your future husband/wife." },
  { type: 'p', id: 'p16', text: 'now going back to the original case, if the thoughts i had about 3D vs 4D space directly or indirectly led me to make some breakthrough about 4D representations or string theory, any reasonable person would call me an idiot for preferring to draw with a tutorial.' },
  { type: 'p', id: 'p17', text: "this is essentially my case for the power of this extended strategy, which i think applies to a lot of varied cases. for a while, education essentially forces kids who don't know any better to take the shading shortcut, because they essentially have to go from outline (assignment expectation) to final product (assignment expectation). so you end up with a lot less of the spouse/4D space serendipity and rather kids who hate history." },
  { type: 'p', id: 'p18', text: "i have no structured solution for the world where shortcuts are abundant, but it seems my strategy going forward is to use this trick to give me more serendipitous outcomes. and this is not really meant to be a criticism towards education or conventional western teachers, or even of shortcuts broadly. my art teacher was a fantastic artist and shared her plentiful love for art by letting unskilled kids make fun drawings with a shortcut." },
  { type: 'p', id: 'p19', text: "but there certainly seems to be a tremendous value to taking detours for some things, and i have very little clue on what things or how to decide that, but fuck it, maybe i'll finally end up figuring out how to draw a face." },
];

export default function EssayPage() {
  const [vote, setVote] = useState<Vote>(null);
  const [upCount, setUpCount] = useState(0);
  const [downCount, setDownCount] = useState(0);
  const [voteLoading, setVoteLoading] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  const heroImgRef = useRef<HTMLImageElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Parallax on hero image
  useEffect(() => {
    const handleScroll = () => {
      if (!heroImgRef.current) return;
      heroImgRef.current.style.transform = `translateY(${window.scrollY * 0.28}px)`;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll-reveal for body elements
  useEffect(() => {
    const els = bodyRef.current?.querySelectorAll('[data-reveal]');
    if (!els) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.04, rootMargin: '0px 0px -30px 0px' }
    );
    els.forEach((el, i) => {
      (el as HTMLElement).style.transitionDelay = `${i * 0.04}s`;
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Fetch initial votes + comments
  useEffect(() => {
    async function fetchData() {
      try {
        const [voteRes, commentRes] = await Promise.all([
          fetch('/api/like'),
          fetch('/api/comment'),
        ]);
        if (voteRes.ok) {
          const data = await voteRes.json();
          setUpCount(data.up ?? 0);
          setDownCount(data.down ?? 0);
          setVote(data.vote ?? null);
        }
        if (commentRes.ok) {
          const data = await commentRes.json();
          setComments(data.comments || []);
        }
      } catch { /* graceful */ }
      finally { setCommentsLoaded(true); }
    }
    fetchData();
  }, []);

  async function handleVote(direction: 'up' | 'down') {
    if (voteLoading) return;
    setVoteLoading(true);
    try {
      const res = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      });
      if (res.ok) {
        const data = await res.json();
        setUpCount(data.up ?? 0);
        setDownCount(data.down ?? 0);
        setVote(data.vote ?? null);
      }
    } catch { /* graceful */ }
    finally { setVoteLoading(false); }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || commentLoading) return;
    setCommentLoading(true);
    setCommentError('');
    try {
      const res = await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => [...prev, data.comment]);
        setCommentText('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
      } else {
        const data = await res.json();
        setCommentError(data.error || 'Something went wrong.');
      }
    } catch {
      setCommentError('Could not submit. Please try again.');
    } finally {
      setCommentLoading(false);
    }
  }

  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setCommentText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }

  return (
    <main className={styles.main}>

      {/* ── HERO ── */}
      <header className={styles.hero}>
        <div className={styles.heroArtLayer} aria-hidden="true">
          <img ref={heroImgRef} src="/hero-art.jpg" alt="" className={styles.heroArtImg} />
        </div>
        <div className={styles.heroFade} aria-hidden="true" />

        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            <span>drawing</span>
            <span>faces is</span>
            <span>really hard</span>
          </h1>
        </div>

        <div className={styles.heroBottom} aria-hidden="true">
          <span className={styles.heroScrollLine} />
        </div>
      </header>

      {/* ── PROSE ── */}
      <div className={styles.article}>
        <div className={styles.body} ref={bodyRef}>
          {ESSAY.map((block) => {
            if (block.type === 'break') {
              return (
                <div
                  key={block.id}
                  className={styles.sectionBreak}
                  data-reveal
                  aria-hidden="true"
                  style={{ opacity: 0, transform: 'translateY(10px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}
                >
                  <span>∗</span>
                  <span>∗</span>
                  <span>∗</span>
                </div>
              );
            }
            return (
              <p
                key={block.id}
                data-reveal
                className={`${styles.paragraph} ${block.first ? styles.firstParagraph : ''}`}
                style={{ opacity: 0, transform: 'translateY(12px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}
              >
                {block.text}
              </p>
            );
          })}
        </div>

        <div className={styles.endMark} aria-hidden="true">✦</div>

        {/* Votes */}
        <div className={styles.reactions}>
          <button
            onClick={() => handleVote('up')}
            disabled={voteLoading}
            className={`${styles.voteBtn} ${vote === 'up' ? styles.voteBtnActive : ''}`}
            aria-label="Thumbs up"
          >
            <span>👍</span>
            {upCount > 0 && <span className={styles.voteCount}>{upCount}</span>}
          </button>
          <button
            onClick={() => handleVote('down')}
            disabled={voteLoading}
            className={`${styles.voteBtn} ${vote === 'down' ? styles.voteBtnActive : ''}`}
            aria-label="Thumbs down"
          >
            <span>👎</span>
            {downCount > 0 && <span className={styles.voteCount}>{downCount}</span>}
          </button>
        </div>

        <hr className={styles.sectionRule} />

        {/* Comments */}
        <section className={styles.comments}>
          <h2 className={styles.commentsHeading}>responses</h2>

          {commentsLoaded && comments.length === 0 && (
            <p className={styles.noComments}>No responses yet. Be the first.</p>
          )}

          {comments.length > 0 && (
            <div className={styles.commentList}>
              {comments.map(comment => (
                <div key={comment.id} className={styles.comment}>
                  <div className={styles.commentMeta}>
                    <span className={styles.commentName}>{comment.name}</span>
                    <span className={styles.commentDot}>·</span>
                    <time className={styles.commentTime}>{timeAgo(comment.timestamp)}</time>
                  </div>
                  <p className={styles.commentText}>{comment.text}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleComment} className={styles.commentForm}>
            <textarea
              ref={textareaRef}
              value={commentText}
              onChange={handleTextareaInput}
              placeholder="leave a response"
              className={styles.commentInput}
              rows={2}
              maxLength={800}
            />
            {commentError && <p className={styles.commentError}>{commentError}</p>}
            <div className={styles.commentActions}>
              <span className={styles.commentChar}>
                {commentText.length > 0 ? `${commentText.length}/800` : ''}
              </span>
              <button
                type="submit"
                disabled={!commentText.trim() || commentLoading}
                className={styles.commentSubmit}
              >
                {commentLoading ? 'sending…' : 'respond'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
