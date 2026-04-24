import { Box, Fab, CircularProgress } from "@mui/material";
import { LanguageOutlined, Add } from "@mui/icons-material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogout } from "../utils/authUtils";
import { postService, type IPost } from "../services/postService";
import { useCommentCounts } from "../utils/useCommentCounts";
import { useFeedEmptyState } from "../utils/emptyStateConfig";
import PageTopBar from "../components/PageTopBar";
import ReviewList from "../components/ReviewList";
import AppBottomNav from "../components/AppBottomNav";

const PAGE_SIZE = 5;

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const pageRef = useRef(1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const commentCounts = useCommentCounts(posts);
  const handleLogout = useLogout();
  const navigate = useNavigate();
  const feedEmptyState = useFeedEmptyState();

  const fetchPage = useCallback(async (pageNum: number) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const { data, pagination } = await postService.getAll(pageNum, PAGE_SIZE);
      setPosts((prev) => {
        if (pageNum === 1) return data;
        const existingIds = new Set(prev.map((p) => p._id));
        return [...prev, ...data.filter((p) => !existingIds.has(p._id))];
      });
      setTotalCount(pagination.total);
      hasMoreRef.current = pagination.hasMore;
      pageRef.current = pageNum;
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchPage(1).finally(() => {
      setIsLoading(false);
      setInitialLoadDone(true);
    });
  }, [fetchPage]);

  useEffect(() => {
    if (!initialLoadDone) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreRef.current &&
          !isFetchingRef.current
        ) {
          setIsFetchingMore(true);
          fetchPage(pageRef.current + 1).finally(() =>
            setIsFetchingMore(false),
          );
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchPage, initialLoadDone]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F8F9FA",
        display: "flex",
        flexDirection: "column",
        pb: "80px",
      }}
    >
      <PageTopBar
        icon={<LanguageOutlined sx={{ color: "#fff", fontSize: 20 }} />}
        iconBg="#6344F5"
        title="Global Feed"
        subtitle={`${totalCount} review${totalCount !== 1 ? "s" : ""}`}
        onLogout={handleLogout}
      />

      <Box sx={{ flex: 1, px: 2, pt: 2 }}>
        <ReviewList
          posts={posts}
          isLoading={isLoading}
          commentCounts={commentCounts}
          mode="feed"
          emptyState={feedEmptyState}
        />
        <div ref={sentinelRef} />
        {isFetchingMore && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} sx={{ color: "#6344F5" }} />
          </Box>
        )}
      </Box>

      <Fab
        onClick={() => navigate("/create")}
        sx={{
          position: "fixed",
          bottom: 84,
          right: 20,
          bgcolor: "#6344F5",
          "&:hover": { bgcolor: "#512DC8" },
        }}
      >
        <Add sx={{ color: "#fff" }} />
      </Fab>

      <AppBottomNav activeIndex={1} />
    </Box>
  );
};

export default Feed;
