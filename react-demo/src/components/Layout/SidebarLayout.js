// src/components/Layout/SidebarLayout.js
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from './index';
import IconButton from '../UI/IconButton';
import Tabs from '../UI/Tabs';
import KeepAliveOutlet from '../KeepAliveOutlet';
import styles from './Sidebar.module.css';

// 菜单项组件
const MenuItem = ({
    item,
    isActive,
    isCollapsed,
    onClick
}) => {
    return (
        <div
            className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
            onClick={() => onClick(item)}
            title={isCollapsed ? item.label : ''}
        >
            <span className={styles.menuIcon}>
                <svg className={styles.menuSvgIcon} aria-hidden="true">
                    <use xlinkHref={item.icon}></use>
                </svg>
            </span>

            {!isCollapsed && (
                <span className={styles.menuLabel}>{item.label}</span>
            )}
            {!isCollapsed && item.children && (
                <span className={styles.arrow}>▶</span>
            )}
        </div>
    );
};

// 侧边栏组件
const Sidebar = ({
    menuItems = [],
    activeKey,
    onMenuClick,
    collapsed = false,
    onToggle
}) => {
    return (
        <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
            <div className={styles.sidebarHeader}>
                {!collapsed && <h3 className={styles.sidebarTitle}>
                    <svg className={styles.SidebarLayouticon} aria-hidden="true">
                        <use xlinkHref="#icon-shouye3">
                        </use>
                    </svg></h3>}
                <IconButton
                    icon={collapsed ? "#icon-zhankaizhedieyou" : "#icon-zhankaizhediezuo"}
                    onClick={onToggle}
                    title={collapsed ? '展开菜单' : '折叠菜单'}
                    variant="ghost"
                    size="small"
                />
            </div>

            <div className={styles.menu}>
                {menuItems.map(item => (
                    <MenuItem
                        key={item.key}
                        item={item}
                        isActive={activeKey === item.key}
                        isCollapsed={collapsed}
                        onClick={onMenuClick}
                    />
                ))}
            </div>
        </div>
    );
};

// 主布局组件
const SidebarLayout = ({
    menuItems = [],
    moduleKey,
    onLogout
}) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [tabs, setTabs] = useState([]);

    // 根据当前路由和菜单项初始化或更新 tabs
    useEffect(() => {
        const currentPath = location.pathname;
        const currentMenuItem = menuItems.find(item =>
            item.path === currentPath || currentPath.startsWith(item.path + '/')
        );

        if (currentMenuItem) {
            setTabs(prev => {
                const exists = prev.find(tab => tab.key === currentMenuItem.key);
                if (exists) {
                    return prev;
                }
                return [...prev, currentMenuItem];
            });
        }
    }, [location.pathname, menuItems]);

    const activeTab = useMemo(() => {
        const currentPath = location.pathname;
        const menuItem = menuItems.find(item =>
            item.path === currentPath || currentPath.startsWith(item.path + '/')
        );
        return menuItem ? menuItem.key : '';
    }, [location.pathname, menuItems]);

    const handleMenuClick = useCallback((menuItem) => {
        navigate(menuItem.path);
    }, [navigate]);

    const handleTabChange = useCallback((tabKey) => {
        const tab = menuItems.find(t => t.key === tabKey);
        if (tab) {
            navigate(tab.path);
        }
    }, [menuItems, navigate]);

    const handleTabClose = useCallback((tabKey) => {
        if (tabs.length <= 1) return;

        setTabs(prev => {
            const newTabs = prev.filter(t => t.key !== tabKey);
            if (tabKey === activeTab) {
                const closedIndex = prev.findIndex(t => t.key === tabKey);
                const nextTab = newTabs[Math.max(0, closedIndex - 1)];
                if (nextTab) {
                    const menuItem = menuItems.find(item => item.key === nextTab.key);
                    if (menuItem) {
                        navigate(menuItem.path);
                    }
                }
            }
            return newTabs;
        });
    }, [tabs, activeTab, menuItems, navigate]);

    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed(prev => !prev);
    }, []);

    const sidebarComponent = (
        <Sidebar
            menuItems={menuItems}
            activeKey={activeTab}
            onMenuClick={handleMenuClick}
            collapsed={sidebarCollapsed}
            onToggle={toggleSidebar}
        />
    );

    const tabsComponent = (
        <Tabs
            tabs={tabs}
            activeKey={activeTab}
            onTabChange={handleTabChange}
            onTabClose={handleTabClose}
        />
    );

    return (
        <Layout
            sidebar={sidebarComponent}
            tabs={tabsComponent}
            onLogout={onLogout}
        >
            <KeepAliveOutlet />
        </Layout>
    );
};

export default SidebarLayout;