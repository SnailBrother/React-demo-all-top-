
import axios from 'axios';
import React, { useState, useContext, useRef } from 'react';
import './AccountingAdd.css';
import { useAccounting } from './AccountingDataContext/AccountingContext';
import { useAuth } from '../../../context/AuthContext';


// 导入自定义通知组件
import ConfirmationDialogManager from './Notification/ConfirmationDialogManager';
import WordReportGeneratorLoader from './Notification/WordReportGeneratorLoader';
import NotificationManager from './Notification/NotificationManager';

const AccountingAdd = () => {
    const [formData, setFormData] = useState({
        transaction_date: new Date().toISOString().slice(0, 10),
        amount: '',
        transaction_type: '支出',
        category: '餐饮',
        payment_method: '微信支付',
        description: ''
    });
    const [showLoader, setShowLoader] = useState(false);;//添加WordReportGeneratorLoader的引用
   const { user } = useAuth();
           const username = user?.username; // 从 user 对象中获取 username
    const { socket } = useAccounting();

    // 创建通知组件的引用
    const notificationRef = useRef();

    const categories = ["购物", "娱乐", "交通", "餐饮", "医疗", "宠物", "送礼"];
    const paymentMethods = ["现金", "微信支付", "支付宝", "银行卡", "信用卡"];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // 显示加载遮罩
        setShowLoader(true);
        const submitData = {
            ...formData,
            created_by: username,
            amount: parseFloat(formData.amount),
            transaction_date: formData.transaction_date
        };

        try {
            const response = await axios.post(
                'http://121.4.22.55:5201/api/lifebookkeepingaddRecord',
                submitData,
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (response.data.success) {
                //alert('记录添加成功');
                // 使用自定义通知替代 alert
                notificationRef.current.addNotification('记录添加成功', 'success');
                setFormData({
                    transaction_date: new Date().toISOString().slice(0, 10),
                    amount: '',
                    transaction_type: '支出',
                    category: '',
                    payment_method: '微信支付',
                    description: ''
                });

                // 可以移除 AccountingAdd.js 中的 socket.emit('newRecord')，因为后端已经处理了广播
                // 通知服务器广播新记录（可选）
                // if (socket) {
                //  socket.emit('newRecord', response.data.record);
                // }
            } else {
                //alert(response.data.message || '添加失败');
                // 使用自定义通知替代 alert
                notificationRef.current.addNotification(
                    response.data.message || '添加失败',
                    'error'
                );
            }
        } catch (error) {
            // console.error('添加失败:', error);
            notificationRef.current.addNotification(
                `添加失败: ${error.response?.data?.message || error.message}`,
                'error'
            );
        } finally {
            // 无论成功或失败，都隐藏加载遮罩
            setShowLoader(false);
        }
    };

    return (
        <div className="accountingadd-tab-content">
            {/* 添加通知管理器 */}
            <NotificationManager ref={notificationRef} />
            {/* 添加加载遮罩组件 */}
            {/* 有条件的显示加载遮罩组件 */}
            {showLoader && <WordReportGeneratorLoader />}

            <form className="accountingadd-add-form" onSubmit={handleSubmit}>
                {/* 交易日期 */}
                <div className="accountingadd-form-group">
                    <label className="accountingadd-form-label">日&nbsp;&nbsp;&nbsp;期:</label>
                    <input
                        type="date"
                        name="transaction_date"
                        value={formData.transaction_date}
                        onChange={handleChange}
                        className="accountingadd-form-input"
                        required
                    />
                </div>

                {/* 金额 */}
                <div className="accountingadd-form-group">
                    <label className="accountingadd-form-label">金&nbsp;&nbsp;&nbsp;额:</label>
                    <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        className="accountingadd-form-input"
                        required
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                    />
                </div>

                {/* 交易类型 */}
                <div className="accountingadd-form-group">
                    <label className="accountingadd-form-label">类&nbsp;&nbsp;&nbsp;型:</label>
                    <select
                        name="transaction_type"
                        value={formData.transaction_type}
                        onChange={handleChange}
                        className="accountingadd-form-select"
                        required
                    >
                        <option value="支出">支出</option>
                        <option value="收入">收入</option>
                    </select>
                </div>

                {/* 类别 */}
                <div className="accountingadd-form-group">
                    <label className="accountingadd-form-label">类&nbsp;&nbsp;&nbsp;别:</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="accountingadd-form-select"
                    >
                        <option value="">请选择类别</option>
                        {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>

                {/* 支付方式 */}
                <div className="accountingadd-form-group">
                    <label className="accountingadd-form-label">方&nbsp;&nbsp;&nbsp;式:</label>
                    <select
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleChange}
                        className="accountingadd-form-select"
                    >
                        <option value="">请选择支付方式</option>
                        {paymentMethods.map(method => (
                            <option key={method} value={method}>{method}</option>
                        ))}
                    </select>
                </div>

                {/* 描述 */}
                <div className="accountingadd-form-group">
                    <label className="accountingadd-form-label">描&nbsp;&nbsp;&nbsp;述:</label>
                    <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="accountingadd-form-input"
                        placeholder="简要描述交易内容"
                        maxLength="255"
                    />
                </div>

                <button type="submit" className="accountingadd-form-submit">
                    提交
                </button>
            </form>
        </div>
    );
};

export default AccountingAdd;
{/* 创建人 */ }
//  <div className="accountingadd-form-group">
//  <label className="accountingadd-form-label">创建人</label>
//  <input
//      type="text"
//      name="created_by"
//      value={username}
//      readOnly
//      className="accountingadd-form-input"
//  />
// </div>