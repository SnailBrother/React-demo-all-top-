import React, { useState, useEffect } from 'react';
import { useMusic } from '../../../context/MusicContext';
import { useAuth } from '../../../context/AuthContext';
import { toBeijingTime } from '../../../utils';
import io from 'socket.io-client';
import styles from './SongReview.module.css';

const socket = io('http://121.4.22.55:5201');

const SongReview = () => {
  const { user, isAuthenticated } = useAuth();
  const { state } = useMusic();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 获取当前歌曲的评论
  const fetchComments = async () => {
    if (!state.currentSong?.id) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/ReactDemomusic-comments?music_id=${state.currentSong.id}`);
      
      if (!response.ok) {
        throw new Error('获取评论失败');
      }
      
      const data = await response.json();
      setComments(data);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('获取评论失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 提交新评论
  const submitComment = async () => {
    if (!newComment.trim() || !state.currentSong || !user) {
      setError('评论内容不能为空');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/ReactDemomusiccomments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          music_id: state.currentSong.id,
          music_title: state.currentSong.title,
          music_artist: state.currentSong.artist,
          user_name: user.username,
          comment_text: newComment.trim()
        })
      });

      if (!response.ok) {
        throw new Error('提交评论失败');
      }

      const result = await response.json();
      if (result.success) {
        setNewComment('');
        await fetchComments();
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError('提交评论失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 更新评论
  const updateComment = async (commentId) => {
    if (!editText.trim()) {
      setError('评论内容不能为空');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/ReactDemomusiccomments/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_id: commentId,
          comment_text: editText.trim(),
          user_name: user.username
        })
      });

      if (!response.ok) {
        throw new Error('更新评论失败');
      }

      const result = await response.json();
      if (result.success) {
        setEditingComment(null);
        setEditText('');
        await fetchComments();
      }
    } catch (err) {
      console.error('Error updating comment:', err);
      setError('更新评论失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 删除评论
  const deleteComment = async (commentId) => {
    if (!window.confirm('确定要删除这条评论吗？')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/ReactDemomusiccomments/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_id: commentId,
          user_name: user.username
        })
      });

      if (!response.ok) {
        throw new Error('删除评论失败');
      }

      const result = await response.json();
      if (result.success) {
        await fetchComments();
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('删除评论失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 开始编辑评论
  const startEdit = (comment) => {
    setEditingComment(comment.comment_id);
    setEditText(comment.comment_text);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingComment(null);
    setEditText('');
  };

  // 监听 socket 事件
  useEffect(() => {
    socket.on('new-comment', (data) => {
      if (data.music_id === state.currentSong?.id) {
        fetchComments();
      }
    });

    socket.on('comment-updated', (data) => {
      if (data.music_id === state.currentSong?.id) {
        fetchComments();
      }
    });

    return () => {
      socket.off('new-comment');
      socket.off('comment-updated');
    };
  }, [state.currentSong]);

  // 当歌曲改变时重新获取评论
  useEffect(() => {
    fetchComments();
  }, [state.currentSong?.id]);

  return (
    <div className={styles.container}>
      <h2>歌曲评论管理</h2>
      
      {isAuthenticated && user ? (
        <div className={styles.content}>
          {/* 当前歌曲信息 */}
          <div className={styles.currentSong}>
            <h3>当前歌曲</h3>
            {state.currentSong ? (
              <div className={styles.songInfo}>
                <p><strong>歌曲标题:</strong> {state.currentSong.title}</p>
                <p><strong>艺术家:</strong> {state.currentSong.artist}</p>
                <p><strong>歌曲ID:</strong> {state.currentSong.id}</p>
              </div>
            ) : (
              <p className={styles.noSong}>暂无播放歌曲</p>
            )}
          </div>

          {/* 评论输入区域 */}
          {state.currentSong && (
            <div className={styles.commentInput}>
              <h3>发表评论</h3>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="请输入您的评论..."
                rows="4"
                disabled={loading}
              />
              <button 
                onClick={submitComment} 
                disabled={loading || !newComment.trim()}
                className={styles.submitBtn}
              >
                {loading ? '提交中...' : '提交评论'}
              </button>
            </div>
          )}

          {/* 错误信息 */}
          {error && <div className={styles.error}>{error}</div>}

          {/* 评论列表 */}
          <div className={styles.commentsSection}>
            <h3>评论列表 ({comments.length})</h3>
            {loading && comments.length === 0 ? (
              <div className={styles.loading}>加载中...</div>
            ) : comments.length === 0 ? (
              <div className={styles.noComments}>暂无评论</div>
            ) : (
              <div className={styles.commentsList}>
                {comments.map((comment) => (
                  <div key={comment.comment_id} className={styles.commentItem}>
                    {editingComment === comment.comment_id ? (
                      <div className={styles.editComment}>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows="3"
                          disabled={loading}
                        />
                        <div className={styles.editActions}>
                          <button 
                            onClick={() => updateComment(comment.comment_id)}
                            disabled={loading}
                            className={styles.saveBtn}
                          >
                            {loading ? '保存中...' : '保存'}
                          </button>
                          <button 
                            onClick={cancelEdit}
                            disabled={loading}
                            className={styles.cancelBtn}
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={styles.commentHeader}>
                          <span className={styles.userName}>{comment.user_name}</span>
                          <span className={styles.commentTime}>
                            {toBeijingTime(comment.created_at, 'full')}
                            {/* 或者使用相对时间： */}
                            {/* {formatRelativeTime(comment.created_at)} */}
                          </span>
                        </div>
                        <div className={styles.commentText}>{comment.comment_text}</div>
                        {comment.user_name === user.username && (
                          <div className={styles.commentActions}>
                            <button 
                              onClick={() => startEdit(comment)}
                              className={styles.editBtn}
                            >
                              编辑
                            </button>
                            <button 
                              onClick={() => deleteComment(comment.comment_id)}
                              className={styles.deleteBtn}
                            >
                              删除
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.notLoggedIn}>
          <p>请先登录以管理评论</p>
        </div>
      )}
    </div>
  );
};

export default SongReview;