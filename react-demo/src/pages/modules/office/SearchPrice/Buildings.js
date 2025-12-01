import React, { useState, useEffect, useContext } from "react";
import axios from 'axios';
import io from 'socket.io-client';
import "./Buildings.css";
 
import { useAuth } from '../../../../context/AuthContext';
// 初始化Socket.io连接
const socket = io('http://121.4.22.55:5202');

function Buildings() {
  
  const { user } = useAuth();
         const username = user?.username; // 从 user 对象中获取 username
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBuildings, setFilteredBuildings] = useState([]);
  const [allBuildings, setAllBuildings] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editBuilding, setEditBuilding] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [goToPage, setGoToPage] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化加载数据和设置Socket监听
  useEffect(() => {
    fetchRandomBuildings();

    // 设置Socket监听
    socket.on('buildingUpdate', (data) => {
      if (data.action === 'add') {
        setAllBuildings(prev => [...prev, data.building]);
        setFilteredBuildings(prev => [...prev, data.building]);
      } else if (data.action === 'update') {
        setAllBuildings(prev => prev.map(b => b.id === data.building.id ? data.building : b));
        setFilteredBuildings(prev => prev.map(b => b.id === data.building.id ? data.building : b));
      } else if (data.action === 'delete') {
        setAllBuildings(prev => prev.filter(b => b.id !== data.id));
        setFilteredBuildings(prev => prev.filter(b => b.id !== data.id));
      }
    });

    return () => {
      socket.off('buildingUpdate');
    };
  }, []);

  // 获取随机构筑物数据
  const fetchRandomBuildings = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://121.4.22.55:5202/api/getRandomStructures');
      setAllBuildings(response.data.Structures);
      setFilteredBuildings(response.data.Structures);
      // 添加这行设置总条数
    setTotalCount(response.data.Structures.length);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取分页数据
  const fetchBuildingsWithPagination = async (page, size) => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `http://121.4.22.55:5202/api/getStructures?page=${page}&pageSize=${size}`
      );
      setFilteredBuildings(response.data.results);
      setTotalCount(response.data.totalCount);
      setTotalPages(Math.ceil(response.data.totalCount / size));
    } catch (error) {
      console.error('获取分页数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理搜索提交
  const handleSearchSubmit = async () => {
    if (!searchTerm.trim()) {
      setIsSearching(false);
      fetchRandomBuildings();
      return;
    }

    setIsSearching(true);
    setIsLoading(true);
    try {
      const response = await axios.get(
        `http://121.4.22.55:5202/api/searchStructures?term=${encodeURIComponent(searchTerm)}&page=${currentPage}&pageSize=${itemsPerPage}`
      );
      setFilteredBuildings(response.data.results);
      setTotalCount(response.data.totalCount);
      setTotalPages(Math.ceil(response.data.totalCount / itemsPerPage));
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理页码变化
  const handlePageChange = async (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      try {
        setIsLoading(true);
        if (isSearching) {
          // 如果是搜索状态，保持搜索
          const response = await axios.get(
            `http://121.4.22.55:5202/api/searchStructures?term=${encodeURIComponent(searchTerm)}&page=${page}&pageSize=${itemsPerPage}`
          );
          setFilteredBuildings(response.data.results);
        } else {
          // 如果不是搜索状态，获取新的分页数据
          const response = await axios.get(
            `http://121.4.22.55:5202/api/getStructures?page=${page}&pageSize=${itemsPerPage}`
          );
          setFilteredBuildings(response.data.results);
        }
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 处理每页显示数量变化
  const handleItemsPerPageChange = async (e) => {
    const newSize = Number(e.target.value);
    setItemsPerPage(newSize);
    setCurrentPage(1); // 重置到第一页

    try {
      setIsLoading(true);
      if (isSearching) {
        // 如果是搜索状态，保持搜索
        const response = await axios.get(
          `http://121.4.22.55:5202/api/searchStructures?term=${encodeURIComponent(searchTerm)}&page=1&pageSize=${newSize}`
        );
        setFilteredBuildings(response.data.results);
        setTotalCount(response.data.totalCount);
        setTotalPages(Math.ceil(response.data.totalCount / newSize));
      } else {
        // 如果不是搜索状态，获取新的分页数据
        const response = await axios.get(
          `http://121.4.22.55:5202/api/getStructures?page=1&pageSize=${newSize}`
        );
        setFilteredBuildings(response.data.results);
        setTotalCount(response.data.totalCount);
        setTotalPages(Math.ceil(response.data.totalCount / newSize));
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理跳转页码
  const handleGoToPage = async (e) => {
    e.preventDefault();
    const page = parseInt(goToPage, 10);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      try {
        setIsLoading(true);
        if (isSearching) {
          // 如果是搜索状态，保持搜索
          const response = await axios.get(
            `http://121.4.22.55:5202/api/searchStructures?term=${encodeURIComponent(searchTerm)}&page=${page}&pageSize=${itemsPerPage}`
          );
          setFilteredBuildings(response.data.results);
        } else {
          // 如果不是搜索状态，获取新的分页数据
          const response = await axios.get(
            `http://121.4.22.55:5202/api/getStructures?page=${page}&pageSize=${itemsPerPage}`
          );
          setFilteredBuildings(response.data.results);
        }
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    }
    setGoToPage("");
  };

  // 打开编辑模态框
  const handleEditClick = (building) => {
    setEditBuilding(building);
    setIsModalOpen(true);
  };

  // 处理删除操作
  const handleDeleteClick = async () => {
    if (!editBuilding) return;

    try {
      await axios.delete(`http://121.4.22.55:5202/api/deleteStructure/${editBuilding.id}`);
      setIsModalOpen(false);
      setEditBuilding(null);
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  // 处理表单提交
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const updatedBuilding = {
      name: formData.get('name'),
      structure: formData.get('structure'),
      area: formData.get('area'),
      unit: formData.get('unit'),
      price: formData.get('price'),
      notes: formData.get('notes') || '',
    };

    try {
      if (editBuilding) {
        await axios.put(`http://121.4.22.55:5202/api/updateStructure/${editBuilding.id}`, updatedBuilding);
      } else {
        await axios.post('http://121.4.22.55:5202/api/addStructure', updatedBuilding);
      }
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setIsModalOpen(false);
    }
  };

  // 关闭模态框
  const closeModal = () => {
    setIsModalOpen(false);
    setEditBuilding(null);
  };

  return (
    <div className="building-container">
      <header className="building-header">
        <div className="building-search-box">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
            placeholder="请输入关键字..."
            className="building-search-input"
          />
          <button
            type="button"
            className="building-search-button"
            onClick={handleSearchSubmit}
            disabled={!searchTerm.trim()}
          >
            <svg className="building-search-icon" aria-hidden="true">
              <use xlinkHref="#icon-sousuo"></use>
            </svg>
          </button>
          {username === '李中敬' && (
            <button
              className="building-add-button"
              onClick={() => setIsModalOpen(true)}
            >
              <svg className="building-add-icon" aria-hidden="true">
                <use xlinkHref="#icon-tianjia5" />
              </svg>
            </button>
          )}
        </div>
      </header>

      <section className="building-content">
        {isLoading ? (
          <div className="building-loading">
            <div className="building-spinner"></div>
            <p>加载中...</p>
          </div>
        ) : filteredBuildings.length === 0 ? (
          <div className="building-empty">
            <svg className="building-empty-icon" aria-hidden="true">
              <use xlinkHref="#icon-wushuju"></use>
            </svg>
            <p>没有找到相关构筑物</p>
          </div>
        ) : (
          <>
            <div className="building-table-container">
              <table className="building-table">
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>名称</th>
                    <th>结构</th>
                    <th>区域</th>
                    <th>单位</th>
                    <th>单价</th>
                    {username === '李中敬' && <th>操作</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredBuildings.map((building, index) => (
                    <tr key={index}>
                      <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td>{building.name}</td>
                      <td>{building.structure}</td>
                      <td>{building.area}</td>
                      <td>{building.unit}</td>
                      <td>{building.price}</td>
                      {username === '李中敬' && (
                        <td>
                          <button
                            className="building-edit-button"
                            onClick={() => handleEditClick(building)}
                          >
                            <svg className="building-edit-icon" aria-hidden="true">
                              <use xlinkHref="#icon-bianji"></use>
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="building-pagination">
              <div className="building-pagination-info">
                共 {totalCount} 条
              </div>

              <div className="building-pagination-controls">
                <button
                  className="building-pagination-button"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  <svg className="building-pagination-icon" aria-hidden="true">
                    <use xlinkHref="#icon-arrow-double-left"></use>
                  </svg>
                </button>
                <button
                  className="building-pagination-button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <svg className="building-pagination-icon" aria-hidden="true">
                    <use xlinkHref="#icon-arrow-left-bold"></use>
                  </svg>
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  return (
                    <button
                      key={pageNum}
                      className={`building-pagination-button ${currentPage === pageNum ? "building-pagination-active" : ""}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  className="building-pagination-button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <svg className="building-pagination-icon" aria-hidden="true">
                    <use xlinkHref="#icon-arrow-right-bold"></use>
                  </svg>
                </button>
                <button
                  className="building-pagination-button"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <svg className="building-pagination-icon" aria-hidden="true">
                    <use xlinkHref="#icon-arrow-double-right"></use>
                  </svg>
                </button>
              </div>

              <div className="building-pagination-size">
                <select
                  className="building-pagination-select"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value="10">10条/页</option>
                  <option value="20">20条/页</option>
                  <option value="50">50条/页</option>
                  <option value="100">100条/页</option>
                </select>
              </div>

              <div className="building-pagination-jump">
                <form onSubmit={handleGoToPage}>
                  <button
                    type="submit"
                    className="building-pagination-jump-button"
                  >
                    跳至
                  </button>
                  <input
                    type="number"
                    className="building-pagination-input"
                    min="1"
                    max={totalPages}
                    value={goToPage}
                    onChange={(e) => setGoToPage(e.target.value)}
                    placeholder="页码"
                  />
                  <span className="building-pagination-jump-button">页</span>
                </form>
              </div>
            </div>
          </>
        )}
      </section>

      {isModalOpen && (
        <div className="building-modal">
          <div className="building-modal-content">
            <div className="building-modal-header">
              <h2>{editBuilding ? '编辑构筑物' : '新增构筑物'}</h2>
              <button
                className="building-modal-close"
                onClick={closeModal}
              >
                <svg className="building-modal-close-icon" aria-hidden="true">
                  <use xlinkHref="#icon-guanbi"></use>
                </svg>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="building-modal-form">
              <div className="building-form-group">
                <label className="building-form-label">名称</label>
                <input
                  type="text"
                  name="name"
                  className="building-form-input"
                  defaultValue={editBuilding?.name || ''}
                  required
                />
              </div>

              <div className="building-form-group">
                <label className="building-form-label">结构</label>
                <input
                  type="text"
                  name="structure"
                  className="building-form-input"
                  defaultValue={editBuilding?.structure || ''}
                  required
                />
              </div>

              <div className="building-form-group">
                <label className="building-form-label">区域</label>
                <input
                  type="text"
                  name="area"
                  className="building-form-input"
                  defaultValue={editBuilding?.area || ''}
                  required
                />
              </div>

              <div className="building-form-group">
                <label className="building-form-label">单位</label>
                <input
                  type="text"
                  name="unit"
                  className="building-form-input"
                  defaultValue={editBuilding?.unit || ''}
                  required
                />
              </div>

              <div className="building-form-group">
                <label className="building-form-label">单价</label>
                <input
                  type="text"
                  name="price"
                  className="building-form-input"
                  defaultValue={editBuilding?.price || ''}
                  required
                />
              </div>
              <div className="building-form-group">
                <label className="building-form-label">备注</label>
                <textarea
                  name="notes"
                  className="building-form-textarea"
                  defaultValue={editBuilding?.notes || ''}
                  rows="3"
                />
              </div>
              <div className="building-modal-actions">
                <button
                  type="submit"
                  className="building-modal-save"
                >
                  保存
                </button>
                {editBuilding && (
                  <button
                    type="button"
                    className="building-modal-delete"
                    onClick={handleDeleteClick}
                  >
                    删除
                  </button>
                )}
                <button
                  type="button"
                  className="building-modal-cancel"
                  onClick={closeModal}
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Buildings;