import React, { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './Specialtips.css';
import { Loading } from '../../../components/UI';
const socket = io('http://121.4.22.55:5201'); // 请根据实际情况修改服务器地址

export default function Specialtips() {
    const [tips, setTips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchTipsData = async () => {
            try {
                const response = await axios.get('http://121.4.22.55:5201/api/getSpecial_TipsData');
                setTips(response.data.Special_Tips);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching tips data:', error);
                setLoading(false);
            }
        };

        fetchTipsData();

        // 监听 socket.io 的事件
        socket.on('tips-update', (newTips) => {
            setTips(newTips);
        });

        return () => {
            socket.off('tips-update');
        };
    }, []);

    const filteredTips = tips.filter(tip =>
        tip.tip_content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="specialtips-loading"> <Loading message="特别提示加载中" /></div>;
    }

    return (
        <div className="specialtips-app">
            <div className="specialtips-header">
                {/* <h1 className="specialtips-title">特殊提示</h1> */}
                <div className="specialtips-search-container">
                    <input
                        type="text"
                        placeholder="搜索提示..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="specialtips-search-input"
                    />
                </div>
            </div>

            <div className="specialtips-content">
                {filteredTips.length > 0 ? (
                    <div className="specialtips-grid">
                        {filteredTips.map((tip, index) => (
                            <div key={index} className="specialtips-card">
                                <div className="specialtips-card-header">
                                    <span className="specialtips-card-category">{tip.asset_type}</span>
                                </div>
                                <div className="specialtips-card-body">
                                    <p className="specialtips-card-content">{tip.tip_content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="specialtips-empty">
                        没有找到相关提示
                    </div>
                )}
            </div>
        </div>
    );
}