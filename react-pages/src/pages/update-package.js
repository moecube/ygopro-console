import React, { Component } from 'react'
import { Row, Col, Button, ListGroup, ListGroupItem } from 'react-bootstrap'
import { message_object } from "../components/Message";
import Config from '../Config.json'
import moment from 'moment'

class MCProConsoleUpdatePackagePage extends Component
{
    constructor()
    {
        super();
        this.state = {
            running: false,
            data: null,
            last: null
        };
        this.time_id = null;
    }

    componentDidMount()
    {
        this.fetchData();
        this.time_id = setInterval(this.silentFetchData.bind(this), 1000);
    }

    componentWillUnmount()
    {
        clearInterval(this.time_id);
    }

    fetchData()
    {
        message_object.doFetch("packager progress", Config.packageServerHost + "progress", {}, function (result) {
            return result.json().then(function(result){
                this.setState({
                    running: !(result === null),
                    data: result
                });
            }.bind(this));
        }.bind(this));
        message_object.doFetch("packager progress", Config.packageServerHost + "last", {}, function (result) {
            return result.json().then(function(result){
                this.setState({last: result});
            }.bind(this));
        }.bind(this));
    }

    async silentFetchData()
    {
        let result = await fetch(Config.packageServerHost + "progress");
        let json = await result.json();
        this.setState({
            running: !(json === null),
            data: json
        });
    }

    startPackage()
    {
        message_object.doFetch("package", Config.packageServerHost + "pack", { method: "POST" }, function (result) {
            return result.text().then(function (result) {
                this.fetchData();
                return result;
            }.bind(this));
        }.bind(this))
    }

    updateUpdater()
    {
        message_object.doFetch("package", Config.updateServerHost + "clear", { method: "post" }, function () {
            
        });
    }

    formatTime(obj) {
        return moment(obj).format("YYYY-MM-DD HH:mm:ss");
    }

    render()
    {
        const text = {
            0: "正在清点文件",
            1: "正在上传文件列表",
            11: "正在生成完整包",
            12: "正在生成散包",
            13: "正在生成策略包",
            14: "正在计算文件大小",
            20: "正在上传存档",
            21: "正在写入发行版",
            22: "正在写入发行版",
            30: "正在发布文件",
            999: "已跳过"
        };
        let running_part = null;
        if (this.state.running)
        {
            console.log(this.state.data)
            if (this.state.data.data.main_progress <= 0)
            {
                let child_running_part = "正在下载：第 " + this.state.data.data.child_progress.toString() + " 部分";
                if (this.state.data.data.child_progress >= 100)
                    child_running_part = "正在解包：第 " + (this.state.data.data.child_progress - 99).toString() + " 部分";
                else if (this.state.data.data.child_progress === 0)
                    child_running_part = "正在进行 py 交易...";
                running_part = (<ListGroup>
                        <ListGroupItem header="准备步骤" bsStyle="info">{child_running_part}</ListGroupItem>
                    </ListGroup>);
            }
            else
            {
                running_part = (
                    <div>
                        <p>上一个打包任务开始于 <kbd>{moment(this.state.data.start_time).format("YYYY-MM-DD HH:mm:ss")}</kbd></p>
                        <ListGroup>
                            {
                                <ListGroupItem header="准备步骤" bsStyle="success">已完成</ListGroupItem>
                            }
                            {
                                this.state.data.data.progress_list.map(function(b_name, index) {
                                    index += 1;
                                    return <ListGroupItem header={b_name} bsStyle={index < this.state.data.data.main_progress ? "success" : index > this.state.data.data.main_progress ? "warning" : "info"}>
                                        {index < this.state.data.data.main_progress ? "已完成" : index > this.state.data.data.main_progress ? "正在等待" : text[this.state.data.data.child_progress]
                                    }</ListGroupItem>
                                }.bind(this))
                            }
                        </ListGroup>
                    </div>)
            }
        }
        else
            running_part = (<div>
                    <p>打包器在空闲状态，没有任务正在执行。</p>
                    <Button bsSize="large" bsStyle="primary" onClick={this.startPackage.bind(this)}>开始执行打包</Button>
                </div>);

        let last_part_report = <div>正在获取状态...</div>;
        if (this.state.last != null)
        switch (this.state.last.status)
        {
            case 'null':
                last_part_report = <div>打包器启动于 <kbd>{this.formatTime(this.state.last.time)}</kbd> </div>;
                break;
            case 'success':
                last_part_report = <div>上一个于 <kbd>{this.formatTime(this.state.last.start)}</kbd> 开始的任务已于 <kbd>{this.formatTime(this.state.last.time)}</kbd> 成功结束。</div>;
                break;
            case 'unusual':
                last_part_report = <div>上一个于 <kbd>{this.formatTime(this.state.last.start)}</kbd> 开始的任务已于 <kbd>{this.formatTime(this.state.last.time)}</kbd> 成功结束。但有些任务可能被跳过了。</div>;
                break;
            case 'fail':
                last_part_report = <div>上一个于 <kbd>{this.formatTime(this.state.last.start)}</kbd> 开始的任务已失败。</div>;
                break;
            default:
                last_part_report = <div>打包器正在外太空漂浮，我们不知道它的当前状态</div>;
                break;
        }

        let updatePart = <Col md={6} xs={12}>
            <h2 className="page-header">更新器</h2>
            <Button bsSize="large" onClick={this.updateUpdater.bind(this)}>刷新缓存</Button>
        </Col>;

        return (
            <Row>
                <Col md={6} xs={12}>
                    <h2 className="page-header">打包器</h2>
                    {this.state.running ? "" : last_part_report}
                    {this.state.running ? "" : <br />}
                    {running_part}
                </Col>

                {updatePart}
            </Row>
        )
    }
}

export default MCProConsoleUpdatePackagePage;