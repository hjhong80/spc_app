package com.spc.spc_back.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.spc.spc_back.entity.spcdata.Project;

@Mapper
public interface ProjectMapper {
    int insertProject(Project project);

    Project selectProjectByProjId(Long projId);

    List<Project> selectProjectListByKeyword(String keyword);

    List<Project> selectProjectList();

    int updateProject(Project project);

    int deleteProject(Long projId);
}
