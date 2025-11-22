import React, { useState, useEffect, useContext } from "react";
import axios from 'axios';
import './AccountingDetailsChange.css';
import { useAuth } from '../../../context/AuthContext';

const AccountingDetailsChange = ({ record, onClose, onUpdateSuccess, onDeleteSuccess }) => {
    const [formData, setFormData] = useState({
        transaction_date: '',
        amount: '',
        transaction_type: '支出',
        category: '',
        payment_method: '',
        description: '',
        note: '',
        created_by: '',
        updated_by: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { user } = useAuth();
        const username = user?.username; // 从 user 对象中获取 username

    useEffect(() => {
        if (record) {
            setFormData({
                transaction_date: record.transaction_date? record.transaction_date.slice(0, 10) : '',
                amount: record.amount || '',
                transaction_type: record.transaction_type || '支出',
                category: record.category || '',
                payment_method: record.payment_method || '',
                description: record.description || '',
                note: record.note || '',
                created_by: record.created_by || '',
                updated_by: record.updated_by || ''
            });
        }
    }, [record]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
           ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        // 将 updated_by 设置为从 AuthContext 中获取的 username
        formData.updated_by = username; 

        try {
            const response = await axios.put(
                `http://121.4.22.55:5201/api/lifebookkeepingupdateRecord/${record.transaction_id}`,
                formData
            );
            onUpdateSuccess(response.data);
        } catch (err) {
            setError('更新记录失败: ' + (err.response?.data?.message || err.message));
            console.error('更新记录失败:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('确定要删除这条记录吗？')) return;

        setIsLoading(true);
        setError('');

        try {
            await axios.delete(
                `http://121.4.22.55:5201/api/lifebookkeepingdeleteRecord/${record.transaction_id}`
            );
            onDeleteSuccess();
        } catch (err) {
            setError('删除记录失败: ' + (err.response?.data?.message || err.message));
            console.error('删除记录失败:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="accounting-details-change-modal">
            <div className="accounting-details-change-modal-content">
                <div className="accounting-details-change-modal-header">
                    <h2>编辑记录</h2>
                    <button onClick={onClose} className="accounting-details-change-close-btn">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="accounting-details-change-form-group">
                        <label>交易类型</label>
                        <select
                            name="transaction_type"
                            value={formData.transaction_type}
                            onChange={handleChange}
                            required
                        >
                            <option value="收入">收入</option>
                            <option value="支出">支出</option>
                        </select>
                    </div>

                    <div className="accounting-details-change-form-group">
                        <label>交易时间</label>
                        <input
                            type="date"
                            name="transaction_date"
                            value={formData.transaction_date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="accounting-details-change-form-group">
                        <label>金额</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            required
                        />
                    </div>

                    <div className="accounting-details-change-form-group">
                        <label>类别</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        >
                            <option value="购物">购物</option>
                            <option value="娱乐">娱乐</option>
                            <option value="交通">交通</option>
                            <option value="餐饮">餐饮</option>
                            <option value="医疗">医疗</option>
                            <option value="宠物">宠物</option>
                            <option value="送礼">送礼</option>
                        </select>
                    </div>

                    <div className="accounting-details-change-form-group">
                        <label>支付方式</label>
                        <select
                            name="payment_method"
                            value={formData.payment_method}
                            onChange={handleChange}
                        >
                            <option value="">请选择支付方式</option>
                            <option value="现金">现金</option>
                            <option value="微信支付">微信支付</option>
                            <option value="支付宝">支付宝</option>
                            <option value="银行卡">银行卡</option>
                            <option value="信用卡">信用卡</option>
                        </select>
                    </div>

                    <div className="accounting-details-change-form-group">
                        <label>交易描述</label>
                        <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="accounting-details-change-form-group">
                        <label>记录创建人</label>
                        <select
                            name="created_by"
                            value={formData.created_by}
                            onChange={handleChange}
                            required
                        >
                            <option value="">请选择创建人</option>
                            <option value="陈彦羽">陈彦羽</option>
                            <option value="李中敬">李中敬</option>
                        </select>
                    </div>

                    {/* 移除最近更新记录的人输入框 */}

                    <div className="accounting-details-change-form-group">
                        <label>修改备注</label>
                        <textarea
                            name="note"
                            value={formData.note}
                            onChange={handleChange}
                            rows="3"
                        />
                    </div>

                    {error && <div className="accounting-details-change-error">{error}</div>}

                    <div className="accounting-details-change-modal-footer">
                        <button 
                            type="button" 
                            className="accounting-details-change-delete-btn"
                            onClick={handleDelete}
                            disabled={isLoading}
                        >
                            {isLoading? '处理中...' : '删除'}
                        </button>
                        <div>
                            <button 
                                type="button" 
                                className="accounting-details-change-cancel-btn"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                取消
                            </button>
                            <button 
                                type="submit" 
                                className="accounting-details-change-save-btn"
                                disabled={isLoading}
                            >
                                {isLoading? '保存中...' : '保存'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountingDetailsChange;